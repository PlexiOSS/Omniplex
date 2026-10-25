---
title: Bot Status & Uptime
description: How Omniplex decides whether your bot shows as online, and what the uptime percentage on your page means.
order: 2
---

The coloured dot on your bot's avatar and the status next to its name ("Online", "Idle", "Do not disturb" or "Offline") come from a few different sources, and the Uptime figure in your bot's Stats is tracked separately.

## How status is decided

Omniplex checks these in order and uses the first one that has an answer:

1. **The status your bot posted.** If you send `status` when [posting stats](/kb/developers/posting-stats), that's what's shown, and it stays until you post a different one.
2. **Our own Discord connection.** If your bot is in our main Discord server, we can see its live presence directly.
3. **japi.rest.** For bots outside our server, we check their presence through [japi.rest](https://japi.rest) every few minutes.
4. **Recent stats.** If your bot posted a server count in the last 24 hours, it's shown as online.

If none of these has an answer, your bot shows as offline.

## Why your bot might show offline when it isn't

- It isn't in our main server, japi.rest couldn't see it, and it hasn't posted stats in the last 24 hours. Posting stats (even just `status`) is the most reliable fix.
- It posted `offline` at some point and hasn't posted anything since. A posted status sticks until you replace it.

## Uptime

Every 5 minutes we check whether each listed bot is online, using our Discord connection and japi.rest. The **Uptime** percentage on your bot's page is the share of those checks where it was online, since we started tracking it.

The status your bot posts itself doesn't count towards uptime, so uptime reflects what we could actually observe. A bot that's new to the list, or that we can't see through either source, can show a lower uptime than it really has until more checks have run.
