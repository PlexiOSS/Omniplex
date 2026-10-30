# omniplex

The official Rust SDK for [Omniplex](https://omniplex.gg). Post your bot's or server's stats, check whether someone has voted, and verify the webhooks Omniplex sends you.

- Async, built on [tokio](https://tokio.rs) and [reqwest](https://docs.rs/reqwest) with rustls, so there's no OpenSSL to install.
- Works with serenity, poise, twilight and anything else on tokio.
- Typed votes and webhook events.
- Retries rate-limited requests using the API's `Retry-After` header.

```sh
cargo add omniplex
```

Rust 1.85 or newer.

## Getting a token

Posting stats needs an API token for your bot or server. Open your [dashboard](https://omniplex.gg/dashboard), pick the bot or server, and create one under **API sessions**. Reading public data and checking votes don't need a token.

Keep the token secret, for example in an environment variable.

## Posting stats

```rust,no_run
use omniplex::{BotStats, Omniplex, PresenceStatus};

# async fn run() -> omniplex::Result<()> {
let omniplex = Omniplex::with_token(std::env::var("OMNIPLEX_TOKEN").unwrap());

omniplex
    .post_bot_stats(&BotStats {
        servers: Some(213),
        shards: Some(1),
        status: Some(PresenceStatus::Online),
        ..Default::default()
    })
    .await?;
# Ok(())
# }
```

Or let the SDK post for you. It posts once straight away, then on the interval you choose (at least a minute), in a background task:

```rust,no_run
use std::time::Duration;
use omniplex::{BotStats, Omniplex};

# async fn run() {
let omniplex = Omniplex::with_token(std::env::var("OMNIPLEX_TOKEN").unwrap());

let poster = omniplex.auto_post_bot_stats(Duration::from_secs(30 * 60), || async {
    BotStats {
        servers: Some(213),
        ..Default::default()
    }
});

// Later, if you need to:
poster.stop();
# }
```

Failed posts are printed to stderr. Use `auto_post_bot_stats_with` to handle each result yourself.

`status` is optional and reports your bot's presence (`Online`, `Idle`, `Dnd` or `Offline`). Omniplex keeps showing the last value you posted, so post it regularly if you use it.

For a server, use a server token and `post_server_stats(&ServerStats { total_members, online_members })`.

## Checking votes

```rust,no_run
# async fn run() -> omniplex::Result<()> {
let omniplex = omniplex::Omniplex::new();

if omniplex.has_voted("BOT_ID", "USER_ID").await? {
    // reward them
}

let vote = omniplex.get_bot_vote("BOT_ID", "USER_ID").await?;
if let Some(wait) = vote.wait {
    println!("They can vote again in {:?}", wait.duration());
}
# Ok(())
# }
```

`has_voted_for_server` and `get_server_vote` do the same for servers.

## Webhooks

Omniplex can call your server when someone votes for or reviews your bot or server. Set a secret on the webhook in your dashboard and choose **HMAC signature**. The SDK also verifies the older `splashtail` and `simple-auth` methods.

Always verify the request using the **raw** body. Omniplex occasionally sends one signed with the wrong secret to check that your endpoint rejects it, so return `401` when verification fails.

`verify_webhook` takes the body, the request's headers (an `http::HeaderMap`, a `HashMap<String, String>` or a slice of pairs) and your secret. With axum:

```rust,ignore
use axum::{body::Bytes, http::{HeaderMap, StatusCode}};
use omniplex::{WebhookEventData, verify_webhook};

async fn omniplex_webhook(headers: HeaderMap, body: Bytes) -> StatusCode {
    let Ok(event) = verify_webhook(&body, &headers, SECRET) else {
        return StatusCode::UNAUTHORIZED;
    };

    if let WebhookEventData::NewVote(vote) = &event.data {
        if !vote.downvote && !vote.auto {
            reward_voter(&event.creator.as_ref().unwrap().id).await;
        }
    }
    StatusCode::NO_CONTENT
}
```

### Events

| `event.data` | Fields |
|---|---|
| `NewVote` | `votes`, `per_user` (2 on a double-vote weekend), `downvote`, `auto` (cast by Auto-vote) |
| `NewReview` | `review_id`, `content`, `stars`, `owner_review` |
| `EditReview` | `review_id`, `stars` and `content` as `Changeset { old, new }`, `owner_review` |
| `DeleteReview` | `review_id`, `content`, `stars`, `owner_review` |
| `TeamEdit` | `name`, `short`, `tags`, `extra_links` and `nsfw` as `Changeset { old, new }` |
| `Unknown` | an event this version doesn't know yet, with its raw JSON |

Every event also has `creator` (who did it), `targets` (the `bot`, `server` or `team`) and `metadata` (`created_at` in seconds, and `test` for test sends).

## Errors

Failed requests return `Error::Api` with the HTTP `status`, the API's `message`, any validation `context` and `retry_after` when you're rate limited. `Error::MissingToken` means you tried to post stats without a token.

## Options

```rust,no_run
let omniplex = omniplex::Omniplex::builder()
    .token("TOKEN")
    .base_url("https://api.omniplex.gg") // the default
    .max_retries(2)                      // retries for rate limits and failed GETs
    .build();
```

Pass your own `reqwest::Client` with `.http_client(...)` to control timeouts or proxies.

## Links

- [Developer docs](https://omniplex.gg/kb/developers)
- [Other SDKs](https://omniplex.gg/kb/developers/sdks)
- [Report a bug](https://github.com/PlexiOSS/Omniplex/issues)
