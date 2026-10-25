---
title: Listing a Server
description: Add your Discord server to Omniplex, and what our tracking bot does for your listing.
order: 5
---

## Adding your server

1. Go to [Add a Server](/servers/add) and paste a **permanent** invite link to your server. Temporary or one-use invites will get the listing delisted once they expire.
2. Click **Look up server**. We fill in its name, icon and member count from the invite.
3. If our tracking bot isn't in the server yet, use the **Invite the bot** link, then **check again**. The bot has to be in the server before you can list it.
4. Add a short description (30 to 150 characters), a long description (at least 500 characters) and 1 to 5 tags, and pick which [team](/kb/listings/teams) owns it. If you don't pick one, a team is created for you.
5. Submit. Like bots, new servers are reviewed by staff before they're public. Read the [Listing Rules](/kb/servers/listing-rules) first.

## Who can list a server

To list a server you must be its **owner**, or have the **Manage Server** or **Administrator** permission in it. We check this through our tracking bot when you submit, which is why the bot needs to be in the server first. This stops people listing servers they don't run.

## The tracking bot

Omniplex's tracking bot keeps server listings up to date. With the bot in your server:

- **Member counts** (total and online) stay current automatically.
- **Emojis and stickers** from your server are shown on your listing, and appear in the site-wide emoji and sticker galleries.
- **Invites** can be generated for your listing, so a join button keeps working even if an old invite link expires.

The bot only asks for the permissions it needs and doesn't read your server's messages.

## Managing your listing from Discord

With the tracking bot in your server, you can manage the listing without leaving Discord:

- `/update`: edit the short and long description, or set a new invite link.
- `/delete`: remove the listing (it asks you to confirm first).
- `/leaderboard`: show who has voted for your server the most.

These need the matching permission on the listing, the same as on the website. You can also do all of this from your [dashboard](/dashboard).

## Reporting member counts yourself

If you'd rather report member counts from your own bot, see [Posting Stats](/kb/developers/posting-stats#servers). Once you post counts yourself, the tracking bot stops overwriting them.
