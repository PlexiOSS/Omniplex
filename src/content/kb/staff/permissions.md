---
title: Permissions Reference
description: Every staff permission that exists, grouped by category, and what holding it actually lets you do.
order: 2
---

Permissions are granular each position on the [Staff Hierarchy](/kb/staff/hierarchy) page holds an explicit list of these, except for the four Administrator-level positions, which hold everything. Permissions marked **Dangerous** below are irreversible, hard to undo, or otherwise carry real risk if used carelessly.

## Administration

| Permission | What it does |
|---|---|
| Administrator | Full control over everything. Implies every other permission on this page. |
| View Panel | Access the staff panel and see the data on it. |
| View Audit Logs | See the log of every staff action taken through the panel and the staff bot. |
| View Sensitive Data ⚠️ | See data hidden from other staff, such as private contact details on an entity. |
| Use Staging Keys | Perform actions that use test payment keys on staging and development instances. |

## Bot Reviews

| Permission | What it does |
|---|---|
| Review Bots | Claim, unclaim, approve, deny, and unverify bots in the review queue. |
| Certify Bots | Grant and remove certification on a bot. |
| Transfer Bots | Move a bot to a different owner or team. |
| Force Remove Bots ⚠️ | Delete a bot from the list outright. This cannot be undone. |

## Users & Votes

| Permission | What it does |
|---|---|
| Manage Premium ⚠️ | Give and take premium status on an entity. |
| Manage Votes ⚠️ | Reset the votes of an entity, or of every entity at once. |
| Ban Voters | Vote-ban and unban a user. |

## Applications

| Permission | What it does |
|---|---|
| View Applications | Read staff and partner applications. |
| Manage Applications | Approve, deny, and otherwise act on applications. |
| Ban Applicants | Bar a user from submitting further applications, and lift that ban. |

## Staff Management

| Permission | What it does |
|---|---|
| View Staff | See the staff list, the roles that exist, and who holds them. |
| Manage Staff Members ⚠️ | Edit a staff member's extra permissions and their sync settings. |
| Manage Staff Roles ⚠️ | Create, edit, reorder, and delete staff positions and the permissions attached to them. |
| Manage Disciplinaries ⚠️ | Create, edit, and delete the disciplinary types that limit a staff member's permissions. |
| View Onboarding | Read the onboarding responses submitted by new staff. |

## Shop

| Permission | What it does |
|---|---|
| View Shop | See shop items, benefits, coupons, and vote credit tiers. |
| Manage Shop | Create, edit, and delete shop items, benefits, coupons, and vote credit tiers. |
| Manage Bot Whitelist | Control which bots are whitelisted for shop purchases. |

## Content

| Permission | What it does |
|---|---|
| Manage Partners | Create, edit, and delete partners. |
| Manage Blog | Create, edit, and delete blog entries. |

## Content Reports

| Permission | What it does |
|---|---|
| Review Reports | List, resolve, and dismiss user-filed content reports (license violations, ToS violations, spam, etc.) against bots, servers, and packs. See [Handling Reports & Tickets](/kb/staff/handling-reports-and-tickets). |

## Support

| Permission | What it does |
|---|---|
| View Tickets | Read support tickets opened by users. |
| Manage Tickets | Reply to and close/reopen any user's support ticket. |

## Guild Moderation

| Permission | What it does |
|---|---|
| Moderate Guild ⚠️ | Kick, ban, and time out members in the community Discord servers, via the staff bot's `/kick`, `/ban`, and `/timeout` commands. |
| Warn Users | Send a formal warning to a member (DM plus a mod-log entry) via `/warn`, without kicking, banning, or timing them out. |

All four commands refuse to act on a target who is themselves staff at a rank equal to or more senior than the caller's own there is one staff hierarchy (the [Staff Hierarchy](/kb/staff/hierarchy) page), not a separate one for Discord moderation.

## External Services

| Permission | What it does |
|---|---|
| View CDN | List CDN scopes and read the files in them. |
| Manage CDN ⚠️ | Upload, replace, and delete files on the CDN. |

## Markers

A handful of permissions carry no power in the panel at all they exist only to label a staff member for other services and role display: **Developer**, **Lead Developer**, **Human Resources**, **Bot Reviewer**, **Service Account**, and **Under Disciplinary**.
