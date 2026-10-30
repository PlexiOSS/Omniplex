---
title: Official SDKs
description: Post stats, check votes and verify webhooks from JavaScript, TypeScript, Python, Go or Rust with our official libraries.
order: 6
---

Our official SDKs handle the parts of the API that bots use most: posting your stats, checking whether someone voted, and verifying [vote webhooks](/kb/developers/vote-webhooks). They retry for you when you're rate limited, and the webhook helpers support every signing method Omniplex uses.

| Language | Package | Install |
|---|---|---|
| JavaScript and TypeScript | [`@omniplex/sdk`](https://www.npmjs.com/package/@omniplex/sdk) | `npm install @omniplex/sdk` |
| Python | [`omniplex-sdk`](https://pypi.org/project/omniplex-sdk/) | `pip install omniplex-sdk` |
| Go | [`github.com/PlexiOSS/Omniplex/packages/sdk-go`](https://pkg.go.dev/github.com/PlexiOSS/Omniplex/packages/sdk-go) | `go get github.com/PlexiOSS/Omniplex/packages/sdk-go` |
| Rust | [`omniplex`](https://crates.io/crates/omniplex) | `cargo add omniplex` |

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

## Go

Needs Go 1.22 or newer, and has no dependencies. The package is named `omniplex`.

```go
client := omniplex.New(os.Getenv("OMNIPLEX_TOKEN"))

go client.AutoPostBotStats(ctx, 30*time.Minute,
	func(ctx context.Context) (omniplex.BotStats, error) {
		return omniplex.BotStats{Servers: omniplex.Int(len(session.State.Guilds))}, nil
	},
	nil,
)

if voted, _ := client.HasVoted(ctx, botID, userID); voted {
	// reward them
}
```

## Rust

Needs Rust 1.85 or newer. It's async and runs on tokio, so it works alongside serenity, poise and twilight.

```rust
use std::time::Duration;
use omniplex::{BotStats, Omniplex};

let omniplex = Omniplex::with_token(std::env::var("OMNIPLEX_TOKEN")?);

omniplex.auto_post_bot_stats(Duration::from_secs(30 * 60), || async {
    BotStats { servers: Some(guild_count()), ..Default::default() }
});

if omniplex.has_voted(bot_id, user_id).await? {
    // reward them
}
```

## Webhooks

Every SDK verifies webhook requests for you. Pass them the raw request body, the headers and your webhook secret, and return `401` if verification fails:

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

Each package's page has the full guide, including framework examples. All of the SDKs are open source in our [GitHub repository](https://github.com/PlexiOSS/Omniplex/tree/master/packages), where you can also report problems.
