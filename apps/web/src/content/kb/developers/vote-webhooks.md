---
title: Vote Webhooks
description: Get notified when someone votes for or reviews your bot, server or team, and how to verify the requests.
order: 3
---

A webhook lets Omniplex call your own server (or post to a Discord channel) whenever something happens to your listing, most commonly a new vote. Bots use this to reward voters.

## Events

| Event | Sent when |
|---|---|
| `NEW_VOTE` | Someone votes for the bot, server or team. Includes the new vote count, how many votes this counted as (2 on a double-vote weekend), whether it was a downvote, and `auto`, which is `true` when the vote came from [Auto-vote](/kb/voting/auto-voting). |
| `NEW_REVIEW` | Someone reviews it. |
| `EDIT_REVIEW` | A review is edited. |
| `DELETE_REVIEW` | A review is deleted. |
| `TEAM_EDIT` | A team's details change (team webhooks only). |

You can limit a webhook to only some events; by default it receives all of them.

## Setting one up

1. Open your [dashboard](/dashboard), find the bot or server, and click **Webhooks**. For a team, use the Webhooks section of the team's settings.
2. Click **New Webhook** and give it a name and the URL to send to.
3. **For a Discord channel**, paste the channel's Discord webhook URL and leave the secret blank. Omniplex posts a formatted message to the channel.
4. **For your own server**, set a secret and choose **HMAC signature (recommended)** as the signing method.
5. Use **Test** to send a test event, then check **Delivery Logs** to see what your server answered.

## Verifying requests

With HMAC signing, each request is a `POST` with a JSON body and these headers:

- `X-Webhook-Signature: sha256=<hex>`: an HMAC-SHA256 of the raw request body, using your secret as the key.
- `X-Webhook-Protocol: hmac-sha256`

Compute the same HMAC over the raw body, compare it to the header using a constant-time comparison, and reject the request if they don't match. This is the same scheme GitHub and Stripe use.

**Your endpoint should reject requests with a bad signature** by returning `401` or `403`. Omniplex occasionally sends a request signed with the wrong secret to check this. If your endpoint accepts it, you get a notification warning you that anyone could send it fake events. Your webhook keeps working, but fix the check: without it, anyone who finds your URL can fake votes.

## What your endpoint should return

- Return a `2xx` status once you've handled the event.
- If your URL returns `404` or `410` (or a Discord channel webhook has been deleted), the webhook is disabled and you get a notification. Fix the URL and save the webhook again to turn it back on.
- Other errors are recorded in **Delivery Logs**, and you get a notification about the failure. A webhook that fails 20 times in a row is paused until you save it again. One successful delivery resets the count, and one webhook failing never affects your others.

Requests time out after 30 seconds, and webhook URLs can't point at `localhost`. Every delivery and its response are kept in **Delivery Logs**.

For full payload examples and the legacy signing methods, see [Webhooks](https://docs.omniplex.gg/docs/developer/webhooks) in the developer docs.
