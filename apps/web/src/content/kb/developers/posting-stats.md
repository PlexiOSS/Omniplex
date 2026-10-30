---
title: Posting Stats
description: Send your bot's server and shard counts to Omniplex so its listing stays accurate.
order: 1
---

Omniplex can't see how many servers your bot is in, so your bot tells us. Posting stats keeps the server count on your card and page accurate, and it's also one of the ways we tell that your bot is online (see [Bot Status & Uptime](/kb/developers/status-and-uptime)).

## 1. Get a token

Open your [dashboard](/dashboard), find the bot, and open **API sessions**. Create a token for the bot and copy it straight away, because it's only shown once. See [API Tokens](/kb/developers/api-tokens) for how tokens work and how to keep them safe.

## 2. Send a request

Send a `POST` request to `https://api.omniplex.gg/bots/stats` with the token in the `Authorization` header (either the raw token, or `Bot <token>`) and a JSON body:

```json
{
  "servers": 1520,
  "shards": 2,
  "shard_list": [0, 1],
  "status": "online"
}
```

Every field is optional:

| Field | What it does |
|---|---|
| `servers` | Your bot's server count, shown on its card and page. |
| `shards` | How many shards your bot runs. |
| `shard_list` | The shard IDs this process runs, if you shard across processes. |
| `users` | Your bot's user count. Stored but not currently shown on the site. |
| `status` | `online`, `idle`, `dnd` or `offline`, shown as your bot's status. |

A field you leave out, or send as `0`, keeps its previous value. A successful request returns `204 No Content`.

The [official SDKs](/kb/developers/sdks) for JavaScript, Python, Go and Rust can post this for you on a timer.

## How often to post

There's no rate limit on this endpoint. Posting when your bot becomes ready and then every 15 to 30 minutes is plenty. If you send `status`, it stays at whatever you posted last, so post `offline` when your bot shuts down cleanly.

## Servers

Server listings normally don't need this. Our tracking bot keeps member counts up to date by itself (see [Listing a Server](/kb/listings/listing-a-server)). If you'd rather report them yourself, `POST https://api.omniplex.gg/servers/stats` with `total_members` and `online_members`, using a token created for the server. Once you post, the tracking bot stops overwriting those counts.

For the full request and response reference, see [Bot Stats](https://docs.omniplex.gg/docs/developer/bot-stats) in the developer docs.
