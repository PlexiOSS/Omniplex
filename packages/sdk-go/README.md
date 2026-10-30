# Omniplex Go SDK

The official Go SDK for [Omniplex](https://omniplex.gg). Post your bot's or server's stats, check whether someone has voted, and verify the webhooks Omniplex sends you.

- Standard library only, no dependencies.
- Works with discordgo, disgo, arikawa and anything else.
- Typed votes and webhook events.
- Retries rate-limited requests using the API's `Retry-After` header.

```sh
go get github.com/PlexiOSS/Omniplex/packages/sdk-go
```

```go
import "github.com/PlexiOSS/Omniplex/packages/sdk-go"
```

The package is named `omniplex`. Go 1.22 or newer.

## Getting a token

Posting stats needs an API token for your bot or server. Open your [dashboard](https://omniplex.gg/dashboard), pick the bot or server, and create one under **API sessions**. Reading public data and checking votes don't need a token.

Keep the token secret, for example in an environment variable.

## Posting stats

```go
client := omniplex.New(os.Getenv("OMNIPLEX_TOKEN"))

err := client.PostBotStats(ctx, omniplex.BotStats{
	Servers: omniplex.Int(len(guilds)),
	Shards:  omniplex.Int(1),
	Status:  omniplex.StatusOnline,
})
```

Or let the SDK post for you. `AutoPostBotStats` posts once straight away, then on the interval you choose (at least a minute, 30 minutes if you pass 0), until the context is cancelled:

```go
go client.AutoPostBotStats(ctx, 30*time.Minute,
	func(ctx context.Context) (omniplex.BotStats, error) {
		return omniplex.BotStats{Servers: omniplex.Int(len(session.State.Guilds))}, nil
	},
	func(err error) { log.Printf("posting stats to Omniplex: %v", err) },
)
```

`Status` is optional and reports your bot's presence (`StatusOnline`, `StatusIdle`, `StatusDND` or `StatusOffline`). Omniplex keeps showing the last value you posted, so post it regularly if you use it.

For a server, use a server token and `PostServerStats(ctx, omniplex.ServerStats{TotalMembers: ..., OnlineMembers: ...})`.

## Checking votes

```go
client := omniplex.New("")

voted, err := client.HasVoted(ctx, botID, userID)

vote, err := client.GetBotVote(ctx, botID, userID)
if err == nil && vote.Wait != nil {
	fmt.Println("They can vote again in", vote.Wait.Duration())
}
```

`HasVotedForServer` and `GetServerVote` do the same for servers.

## Webhooks

Omniplex can call your server when someone votes for or reviews your bot or server. Set a secret on the webhook in your dashboard and choose **HMAC signature**. The SDK also verifies the older `splashtail` and `simple-auth` methods.

Omniplex occasionally sends a webhook signed with the wrong secret to check that your endpoint rejects it. `WebhookHandler` verifies every request, answers `401` when verification fails and `204` when your function returns `nil`:

```go
http.Handle("/omniplex", omniplex.WebhookHandler(secret,
	func(r *http.Request, event *omniplex.WebhookEvent) error {
		if vote, ok := event.Data.(*omniplex.NewVoteData); ok && !vote.Downvote && !vote.Auto {
			return rewardVoter(r.Context(), event.Creator.ID)
		}
		return nil
	},
))
```

To verify inside your own handler, use `VerifyWebhookRequest(r, secret)`, or `VerifyWebhook(body, header, secret)` if you've already read the body. Failures match `errors.Is(err, omniplex.ErrInvalidWebhook)`.

### Events

| `event.Type` | `event.Data` |
|---|---|
| `NEW_VOTE` | `*NewVoteData`: `Votes`, `PerUser` (2 on a double-vote weekend), `Downvote`, `Auto` (cast by Auto-vote) |
| `NEW_REVIEW` | `*NewReviewData`: `ReviewID`, `Content`, `Stars`, `OwnerReview` |
| `EDIT_REVIEW` | `*EditReviewData`: `ReviewID`, `Stars` and `Content` as `Changeset{Old, New}`, `OwnerReview` |
| `DELETE_REVIEW` | `*DeleteReviewData`: `ReviewID`, `Content`, `Stars`, `OwnerReview` |
| `TEAM_EDIT` | `*TeamEditData`: `Name`, `Short`, `Tags`, `ExtraLinks` and `NSFW` as `Changeset{Old, New}` |

An event this version doesn't know yet has `Data` set to `nil`, with its raw JSON in `RawData`. Every event also has `Creator` (who did it), `Targets` (the `Bot`, `Server` or `Team`) and `Metadata` (`CreatedAt` in seconds, and `Test` for test sends).

## Errors

Failed requests return an `*omniplex.APIError` with the HTTP `Status`, the API's `Message`, any validation `Context` and `RetryAfter` when you're rate limited. Posting without a token returns `omniplex.ErrMissingToken`.

## Options

```go
client := omniplex.New(token,
	omniplex.WithBaseURL("https://api.omniplex.gg"), // the default
	omniplex.WithMaxRetries(2),                      // retries for rate limits and failed GETs
	omniplex.WithHTTPClient(&http.Client{Timeout: 10 * time.Second}),
)
```

## Links

- [Developer docs](https://omniplex.gg/kb/developers)
- [Other SDKs](https://omniplex.gg/kb/developers/sdks)
- [Report a bug](https://github.com/PlexiOSS/Omniplex/issues)
