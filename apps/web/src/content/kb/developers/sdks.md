---
title: Official SDKs
description: Post stats, check votes and verify webhooks from JavaScript, TypeScript or Python with our official libraries.
order: 6
---

Our official SDKs handle the parts of the API that bots use most: posting your stats, checking whether someone voted, and verifying [vote webhooks](/kb/developers/vote-webhooks). They retry for you when you're rate limited, and the webhook helpers support every signing method Omniplex uses.

| Language | Package | Install |
|---|---|---|
| JavaScript and TypeScript | [`@omniplex/sdk`](https://www.npmjs.com/package/@omniplex/sdk) | `npm install @omniplex/sdk` |
| Python | [`omniplex-sdk`](https://pypi.org/project/omniplex-sdk/) | `pip install omniplex-sdk` |

Posting stats needs an [API token](/kb/developers/api-tokens) for your bot or server. Checking votes and reading public listings don't.

## JavaScript and TypeScript

Works in Node 20 and newer, Bun, Deno and edge runtimes.

```ts
import { Omniplex } from "@omniplex/sdk";

const omniplex = new Omniplex({ token: process.env.OMNIPLEX_TOKEN });

omniplex.autoPostBotStats(() => ({ servers: client.guilds.cache.size }));

if (await omniplex.hasVoted(botId, userId)) {
  // reward them
}
```

## Python

Needs Python 3.11 or newer. There's a sync `Omniplex` client and an async `AsyncOmniplex` client.

```python
from omniplex import AsyncOmniplex

omniplex = AsyncOmniplex(os.environ["OMNIPLEX_TOKEN"])

omniplex.auto_post_bot_stats(lambda: {"servers": len(bot.guilds)})

if await omniplex.has_voted(bot_id, user_id):
    ...  # reward them
```

## Webhooks

Both SDKs verify webhook requests for you. Pass them the raw request body, the headers and your webhook secret, and return `401` if verification fails:

```ts
import { createWebhookHandler } from "@omniplex/sdk";

export const POST = createWebhookHandler(process.env.OMNIPLEX_WEBHOOK_SECRET!, (event) => {
  if (event.type === "NEW_VOTE") console.log(`${event.creator?.username} voted`);
});
```

```python
from omniplex import WebhookVerificationError, verify_webhook

event = verify_webhook(raw_body, headers, secret)  # raises WebhookVerificationError
```

Each package's page has the full guide, including framework examples. Both SDKs are open source in our [GitHub repository](https://github.com/PlexiOSS/Omniplex/tree/master/packages), where you can also report problems.
