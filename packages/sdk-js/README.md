# @omniplex/sdk

The official JavaScript and TypeScript SDK for [Omniplex](https://omniplex.gg). Post your bot's or server's stats, check whether someone has voted, and verify the webhooks Omniplex sends you.

- Works in Node 20+, Bun, Deno, Cloudflare Workers and other runtimes with `fetch` and Web Crypto. No runtime dependencies.
- Fully typed, with the same API types omniplex.gg uses.
- Retries rate-limited requests using the API's `Retry-After` header.

```sh
npm install @omniplex/sdk
```

## Getting a token

Posting stats needs an API token for your bot or server. Open your [dashboard](https://omniplex.gg/dashboard), pick the bot or server, and create one under **API sessions**. Reading public data and checking votes don't need a token.

Keep the token secret, for example in an environment variable.

## Posting stats

```ts
import { Omniplex } from "@omniplex/sdk";

const omniplex = new Omniplex({ token: process.env.OMNIPLEX_TOKEN });

await omniplex.postBotStats({
  servers: client.guilds.cache.size,
  shards: client.shard?.count ?? 1,
  status: "online",
});
```

Or let the SDK post for you. It posts once straight away, then every 30 minutes, and returns a function that stops it:

```ts
const stop = omniplex.autoPostBotStats(() => ({
  servers: client.guilds.cache.size,
  shards: client.shard?.count ?? 1,
}));
```

`status` is optional and reports your bot's presence (`online`, `idle`, `dnd` or `offline`). Omniplex keeps showing the last value you posted, so post it regularly if you use it.

For a server, use a server token and `postServerStats`:

```ts
await omniplex.postServerStats({ totalMembers: 1200, onlineMembers: 340 });
```

## Checking votes

```ts
const omniplex = new Omniplex();

if (await omniplex.hasVoted(botId, userId)) {
  // reward them
}

const vote = await omniplex.getBotVote(botId, userId);
console.log(vote.wait); // how long until they can vote again
```

`hasVotedForServer` and `getServerVote` do the same for servers.

## Webhooks

Omniplex can call your server when someone votes for or reviews your bot or server. Set a secret on the webhook in your dashboard and choose **HMAC signature**. The SDK also verifies the older `splashtail` and `simple-auth` methods.

Always verify the request. Omniplex occasionally sends one signed with the wrong secret to check that your endpoint rejects it.

### Fetch-style handlers (Bun, Deno, Workers, Next.js route handlers)

```ts
import { createWebhookHandler } from "@omniplex/sdk";

export const POST = createWebhookHandler(process.env.OMNIPLEX_WEBHOOK_SECRET!, async (event) => {
  if (event.type === "NEW_VOTE" && !event.data.downvote && !event.data.auto) {
    await rewardVoter(event.creator?.id);
  }
});
```

The handler answers `204` once your callback finishes, `401` when verification fails and `405` for anything but `POST`.

### Express or other frameworks

Verify against the **raw** request body, before any JSON parsing:

```ts
import express from "express";
import { verifyWebhook, WebhookVerificationError } from "@omniplex/sdk";

app.post("/omniplex", express.raw({ type: "*/*" }), async (req, res) => {
  try {
    const event = await verifyWebhook({ body: req.body, headers: req.headers }, secret);
    // handle event
    res.sendStatus(204);
  } catch (err) {
    if (err instanceof WebhookVerificationError) return res.sendStatus(401);
    throw err;
  }
});
```

### Events

| `event.type` | `event.data` |
|---|---|
| `NEW_VOTE` | `votes`, `per_user` (2 on a double-vote weekend), `downvote`, `auto` (cast by Auto-vote) |
| `NEW_REVIEW` | `review_id`, `content`, `stars`, `owner_review` |
| `EDIT_REVIEW` | `review_id`, `stars` and `content` as `{ old, new }`, `owner_review` |
| `DELETE_REVIEW` | `review_id`, `content`, `stars`, `owner_review` |
| `TEAM_EDIT` | `name`, `short`, `tags`, `extra_links` and `nsfw` as `{ old, new }` |

Every event also has `creator` (who did it), `targets` (the `bot`, `server` or `team`) and `metadata` (`created_at` in seconds, and `test` for test sends).

## Errors

Failed requests throw an `OmniplexError` with the HTTP `status`, the API's `message`, any validation `context` and `retryAfter` in seconds when you're rate limited.

```ts
import { OmniplexError } from "@omniplex/sdk";

try {
  await omniplex.postBotStats({ servers: 10 });
} catch (err) {
  if (err instanceof OmniplexError && err.status === 401) {
    console.error("Your Omniplex token is invalid");
  }
}
```

## Options

```ts
new Omniplex({
  token: "…",                         // needed for posting stats
  baseUrl: "https://api.omniplex.gg", // the default
  maxRetries: 2,                      // retries for rate limits and failed GETs
  fetch: customFetch,                 // bring your own fetch
});
```

## Links

- [Developer docs](https://omniplex.gg/kb/developers)
- [Python SDK](https://pypi.org/project/omniplex-sdk/)
- [Report a bug](https://github.com/PlexiOSS/Omniplex/issues)
