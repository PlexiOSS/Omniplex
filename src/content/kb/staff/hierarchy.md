---
title: Staff Hierarchy
description: The staff positions that exist, in seniority order, and what each one is responsible for.
order: 1
---

Every staff member holds one or more **positions**, synced automatically from their roles in the staff Discord server. A position carries a set of permissions it's a job description, not a rank you can put on regardless of what it does.

## Positions, most senior first

| Position | What it's for |
|---|---|
| **Executive** | Full administrative control. Held by as few people as possible. |
| **Management** | Full administrative control, day-to-day operational oversight. |
| **Human Resources** | Full administrative control, focused on staff hiring, onboarding, and disciplinary action. |
| **Lead Developer** | Full administrative control, focused on the platform's technical direction. |
| **Developer** | Broad operational access reviewing bots, managing applications, votes, premium, and staff visibility but not staff management or content itself. |
| **Bot Reviewer** | Claims, reviews, certifies, transfers, and force-removes bots from the review queue. Nothing outside bot review. |
| **Content Manager** | Manages partners and the blog. Nothing else. |
| **Support Agent** | Handles support tickets and can transfer bots and view premium/staff info to help resolve them. |

**Executive**, **Management**, **Human Resources**, and **Lead Developer** all hold the **Administrator** permission, which implies every other permission on the list below. Every other position holds only what's explicitly granted to it see [Permissions Reference](/kb/staff/permissions) for the full list.

## How positions are assigned

Positions are driven entirely by Discord roles in the staff server a scheduled resync keeps `staff_members` in the database in sync with who holds which role, adding, updating, or removing staff rows to match. There's no separate "add a staff member" step: give someone the right Discord role, and the next resync picks it up. The reverse is also true removing the role removes their staff access on the next resync, unless they hold a permission override that's explicitly configured to survive it.

## Owners

Positions marked **owner** in the system (a small, fixed list of Discord user IDs configured at the infrastructure level) always hold the "owner" position regardless of their Discord roles. This exists as a break-glass path it isn't meant to be anyone's day-to-day position.
