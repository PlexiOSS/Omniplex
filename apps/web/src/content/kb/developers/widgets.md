---
title: Embeddable Widgets
description: Show your bot, server or pack's live vote count and stats on your website, README or Discord.
order: 5
---

Every bot, server and pack has a widget: a 480×180 image card with its name, avatar, short description and live stats. It updates on its own, so you can embed it once and forget about it.

## Getting the embed code

On your bot or server page, click **Get embed code** in the sidebar (it's already open if you can edit the listing). Pack pages have the same widget section. Pick your options, then copy the code in the format you need:

- **Markdown**, for a GitHub README or anywhere else that renders Markdown.
- **HTML**, for a website.
- **URL**, the raw image link, for anything else.

The embed links back to your listing, so it doubles as a way for people to vote for you.

## Options

The options are part of the image URL, so you can also set them by hand:

| Option | Values |
|---|---|
| `theme` | `dark` (default) or `light` |
| `accent` | `indigo` (default), `purple`, `blue`, `cyan`, `teal`, `emerald`, `lime`, `amber`, `orange`, `red`, `rose` or `pink` |
| `stats` | A comma-separated list of the stats to show. Bots: `votes`, `servers`. Servers: `votes`, `members`. Leave it out to show every stat, or set it empty (`stats=`) to show none. |

For example, a light widget for a bot showing only its vote count:

```
https://omniplex.gg/bots/your-bot/widget?theme=light&stats=votes
```

Using your bot's vanity URL (see [Vanity URLs, Avatars & Banners](/kb/listings/vanity-and-assets)) in the widget link keeps it readable, but the bot ID works too.

Using the widget on your website, in a command, or in your GitHub repository also counts in your favour when you apply for [Certification](/kb/programs/certification).
