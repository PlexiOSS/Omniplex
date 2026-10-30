---
title: Auto-vote
description: Let Omniplex vote for your favourite bots and servers automatically, always or on a schedule.
order: 3
---

Auto-vote is a $2.99/month subscription that votes for up to 3 bots or servers for you, as soon as your cooldown on each one ends. Set it up from the **Auto-vote** tab in your [dashboard](/dashboard?tab=auto-vote).

## Setting it up

1. Open the **Auto-vote** tab in your dashboard and click **Subscribe**. Payment is handled by Stripe.
2. Search for a bot or server and add it. You can add up to 3.
3. For each one, choose **Whenever possible** or **On a schedule**. A schedule picks the days of the week and a time window, in your own timezone.
4. Click **Save listings**.

You can set up your listings before subscribing, and change them any time. Omniplex checks every few minutes and votes for each listing once your cooldown is over and it's inside its schedule.

## What automatic votes count for

Automatic votes are real upvotes. They count toward the listing's vote count and its ranking, and they're sent to the owner's [vote webhooks](/kb/developers/vote-webhooks) with `auto` set to `true`.

They don't count toward:

- the [voter leaderboard](/leaderboard),
- voting badges such as Active Voter and Top Voter,
- the listing's [vote credits](/kb/premium/shop).

Those stay for votes you cast yourself.

## When a vote is skipped

Auto-vote skips a listing, and shows the reason in your dashboard, when:

- its owner has turned off **Accept automatic votes**,
- it needs a captcha to vote,
- it's no longer listed,
- you've been vote banned.

## Managing your subscription

Click **Manage billing** in the Auto-vote tab to update your card or cancel. If you cancel, Auto-vote keeps running until the end of the period you've paid for.

## For bot and server owners

Automatic votes are accepted by default. To turn them off, open your listing in the dashboard and switch off **Accept automatic votes** under **Options**.
