---
title: Bot Status & Uptime
description: How Omniplex decides whether your bot shows as online, and what the uptime percentage on your page means.
order: 2
---

The coloured dot on your bot's avatar and the status next to its name ("Online", "Idle", "Do not disturb" or "Offline") come from a few different sources, and the Uptime figure in your bot's Stats is tracked separately.

## How status is decided

Omniplex checks these in order and uses the first one that has an answer:

1. **The status your bot posted.** If you send `status` when [posting stats](https://docs.omniplex.gg/docs/developer/bot-stats), that's what's shown, and it stays until you post a different one.
2. **Our own Discord connection.** If your bot is in our main Discord server, we can see its live presence directly.
3. **japi.rest.** For bots outside our server, we check their presence through [japi.rest](https://japi.rest) every few minutes.
4. **Recent stats.** If your bot posted a server count in the last 24 hours, it's shown as online.

If none of these has an answer, your bot shows no status at all.

An offline reading from Discord or japi.rest only counts if we've seen your bot online in the last 7 days. Bots that use HTTP interactions have no presence on Discord, so they always look offline to those sources, and we'd rather show nothing than call a working bot offline. A status your bot posts itself is always trusted.

## Why your bot might show offline when it isn't

- It isn't in our main server, japi.rest couldn't see it, and it hasn't posted stats in the last 24 hours. Posting stats (even just `status`) is the most reliable fix.
- It posted `offline` at some point and hasn't posted anything since. A posted status sticks until you replace it.
- It runs on HTTP interactions instead of a gateway connection and has posted a status in the past week. These bots have no presence on Discord, so once your posts stop, they can look offline for up to 7 days. Keep posting stats with a `status`, or hide your status (see below).

## Uptime

Uptime is the share of checks in the last 30 days where your bot was online. A bot that passes every check shows 100%, each failed check pulls that down, and old failures stop counting once they're more than 30 days old, so a rough patch doesn't follow you around forever.

### How checks work

Every 5 minutes we check whether each listed bot is online, using these sources in order:

1. The status your bot reports when it [posts stats](https://docs.omniplex.gg/docs/developer/bot-stats), as long as it posted in the last 24 hours.
2. Our own Discord connection, for bots in the Omniplex server.
3. japi.rest, which looks up bots outside our server. We refresh these in small batches, so a bot can go a while between refreshes when the list is busy.
4. A stats post with a server count in the last 24 hours, which counts as online.

If none of these knows anything about your bot at that moment, the check is skipped. Missing data never counts against you.

An offline reading from Discord or japi.rest only counts as a failed check if your bot was seen online in the last 7 days. So a real outage shows up, but a bot with no presence isn't marked down forever. If your bot stays offline for more than a week, checks stop counting until it's seen again, and its uptime fades to **No data yet** as the old checks pass 30 days.

### Why it says "No data yet"

You'll see **No data yet** instead of a percentage when your bot hasn't been seen online in the last 30 days. That usually means one of these:

- Your bot was listed recently and hasn't had a check yet. This normally clears up within minutes.
- We can't see your bot. It isn't in our server, japi.rest has no information on it, and it hasn't posted stats.
- Your bot really has been offline for the last 30 days.

We show this instead of 0% because we can't always tell a bot that's down from one we can't see.

### Keeping it accurate

Post stats regularly and include a `status`. It's the most reliable source, and it stops your uptime depending on anything outside your control. See [Posting Stats](https://docs.omniplex.gg/docs/developer/bot-stats).

### Why the numbers changed

In November 2026 we moved from an all-time percentage to the last 30 days, and everyone's uptime started again from zero. The old figures included months of checks wrongly counted as offline, and an all-time figure could take years to recover. Numbers can jump around for the first few days while there are only a few checks behind them.

## Hiding your stats

Don't want to show your uptime or server count? Under **Details** in your bot's dashboard settings, turn off anything you'd rather keep private in **Public stats**. Bots can hide their server count, shards, page views and invite clicks, plus **Uptime and online status**, which removes the uptime figure, the coloured dot and the status next to your bot's name.

Hidden stats disappear from your page, cards, widgets, link previews and the public API. A bot with a hidden status still appears when someone uses the **Hide offline bots** filter. You and your team still see them in your dashboard, and our staff can still see them when reviewing. Votes always show, because lists are ranked by them. We still track hidden stats, so turning one back on shows the full history.
