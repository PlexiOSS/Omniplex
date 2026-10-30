# omniplex-sdk

The official Python SDK for [Omniplex](https://omniplex.gg). Post your bot's or server's stats, check whether someone has voted, and verify the webhooks Omniplex sends you.

- Sync (`Omniplex`) and async (`AsyncOmniplex`) clients, built on [httpx](https://www.python-httpx.org/).
- Works with discord.py, nextcord, disnake, hikari and anything else.
- Typed, with `TypedDict`s for votes and webhook events.
- Retries rate-limited requests using the API's `Retry-After` header.

```sh
pip install omniplex-sdk
```

Python 3.11 or newer. The package installs as `omniplex-sdk` and imports as `omniplex`.

## Getting a token

Posting stats needs an API token for your bot or server. Open your [dashboard](https://omniplex.gg/dashboard), pick the bot or server, and create one under **API sessions**. Reading public data and checking votes don't need a token.

Keep the token secret, for example in an environment variable.

## Posting stats

```python
import os
from omniplex import AsyncOmniplex

omniplex = AsyncOmniplex(os.environ["OMNIPLEX_TOKEN"])

await omniplex.post_bot_stats(servers=len(bot.guilds), shards=bot.shard_count or 1, status="online")
```

Or let the SDK post for you. It posts once straight away, then every 30 minutes, in a background task you can cancel:

```python
import discord
from omniplex import AsyncOmniplex

class Bot(discord.Client):
    async def setup_hook(self):
        self.omniplex = AsyncOmniplex(os.environ["OMNIPLEX_TOKEN"])
        self.omniplex.auto_post_bot_stats(
            lambda: {"servers": len(self.guilds), "shards": self.shard_count or 1}
        )
```

`status` is optional and reports your bot's presence (`online`, `idle`, `dnd` or `offline`). Omniplex keeps showing the last value you posted, so post it regularly if you use it.

For a server, use a server token and `post_server_stats(total_members=..., online_members=...)`.

## Checking votes

```python
from omniplex import Omniplex

with Omniplex() as omniplex:
    if omniplex.has_voted(bot_id, user_id):
        ...  # reward them

    vote = omniplex.get_bot_vote(bot_id, user_id)
    print(vote["wait"])  # how long until they can vote again
```

`has_voted_for_server` and `get_server_vote` do the same for servers. Every method exists on both clients, with `await` on `AsyncOmniplex`.

## Webhooks

Omniplex can call your server when someone votes for or reviews your bot or server. Set a secret on the webhook in your dashboard and choose **HMAC signature**. The SDK also verifies the older `splashtail` and `simple-auth` methods.

Always verify the request, using the **raw** body. Omniplex occasionally sends one signed with the wrong secret to check that your endpoint rejects it, so return `401` when verification fails.

```python
from fastapi import FastAPI, Request, Response
from omniplex import WebhookVerificationError, verify_webhook

app = FastAPI()

@app.post("/omniplex")
async def omniplex_webhook(request: Request):
    try:
        event = verify_webhook(await request.body(), request.headers, SECRET)
    except WebhookVerificationError:
        return Response(status_code=401)

    if event["type"] == "NEW_VOTE" and not event["data"]["downvote"] and not event["data"]["auto"]:
        await reward_voter(event["creator"]["id"])
    return Response(status_code=204)
```

With Flask, pass `request.get_data()` and `request.headers`.

### Events

| `event["type"]` | `event["data"]` |
|---|---|
| `NEW_VOTE` | `votes`, `per_user` (2 on a double-vote weekend), `downvote`, `auto` (cast by Auto-vote) |
| `NEW_REVIEW` | `review_id`, `content`, `stars`, `owner_review` |
| `EDIT_REVIEW` | `review_id`, `stars` and `content` as `{"old", "new"}`, `owner_review` |
| `DELETE_REVIEW` | `review_id`, `content`, `stars`, `owner_review` |
| `TEAM_EDIT` | `name`, `short`, `tags`, `extra_links` and `nsfw` as `{"old", "new"}` |

Every event also has `creator` (who did it), `targets` (the `bot`, `server` or `team`) and `metadata` (`created_at` in seconds, and `test` for test sends).

## Errors

Failed requests raise `OmniplexError` with the HTTP `status`, the API's `message`, any validation `context` and `retry_after` in seconds when you're rate limited.

## Options

```python
Omniplex(
    token=None,                         # needed for posting stats
    base_url="https://api.omniplex.gg", # the default
    max_retries=2,                      # retries for rate limits and failed GETs
    timeout=10.0,
    http_client=None,                   # bring your own httpx.Client
)
```

## Links

- [Developer docs](https://omniplex.gg/kb/developers)
- [JavaScript SDK](https://www.npmjs.com/package/@omniplex/sdk)
- [Report a bug](https://github.com/PlexiOSS/Omniplex/issues)
