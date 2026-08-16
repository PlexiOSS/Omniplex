---
title: Handling Reports & Tickets
description: Where reported content and support tickets actually show up, and what resolving one does (and doesn't) do on its own.
order: 3
---

Reports, applications, the bot queue, and tickets all live under the **Moderation** menu in the [admin panel](/admin) header. Each requires a specific permission to see [Permissions Reference](/kb/staff/permissions) if a page looks empty or missing from the menu, that's almost always why.

## Reports

Anyone can file a report against a bot, server, or pack for a license violation, ToS violation, spam, or anything else that needs a look. [Reports](/admin/reports) requires **Review Reports**.

Opening a report shows the reported entity directly icon, name, and a link to its live listing plus an **Actions** button. Actions loads whatever staff RPC methods actually apply to that entity's type; for a bot, that includes force-removal. **Resolving or dismissing a report does not, by itself, take any action on the reported content** it just closes the report. If the report is valid and the content needs to come down, use the **Actions** button to actually do that separately. This is deliberate: not every valid report calls for the same response, and the two are kept as separate steps so closing a report can't be mistaken for having acted on it.

## Applications

[Applications](/admin/applications) requires **View Applications** to read, **Manage Applications** to approve or deny. Certification approvals automatically grant the relevant Discord roles to the bot's owner (or every member of a certified server's owning team), provided they're already in the main server no manual role assignment needed afterward.

## Bot Queue

[Queue](/admin/queue) is the claim → approve/deny pipeline for new bot submissions. Requires **Review Bots**. Claim a bot before reviewing it unclaimed bots are fair game for anyone with the permission, claimed ones are yours until you unclaim or decide on them.

## Tickets

[Tickets](/admin/tickets) requires **View Tickets** to read, **Manage Tickets** to reply, close, or reopen. Every ticket, not just your own, is listed here filterable by open/closed. Each row links straight into the ticket's own thread.

## Search

[Search](/admin/search) covers every entity type bots, servers, packs, teams, and users by ID or name, with the same **Actions** menu available everywhere else. Useful when you need to act on something outside the queue or a report, e.g. a direct ban request.

## Pointing users at self-service

The staff bot answers `/kb`, `/ticket`, and `/staffinfo` for anyone (not just staff) so you don't have to retype the same links in chat — `/kb` links the Knowledge Base (optionally with a topic to search for), `/ticket` explains how to open a support ticket, and `/staffinfo` links this section. Guild moderation (`/kick`, `/ban`, `/timeout`, `/warn`) is separate, staff-only, and covered in [Permissions Reference](/kb/staff/permissions#guild-moderation).
