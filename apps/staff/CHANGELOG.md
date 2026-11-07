# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.0] - 2026-11-07

### Changed

- The Payments page labels monthly booster premium as "Booster perk".
- Auto-vote subscribers on the Payments page show their extra slots and
  whether they're on the yearly plan.
- The Payments page marks Auto-vote listings their subscriber has paused.

### Added

- Promo Codes have a **Who used it** list (who, what for, when, and whether
  they paid) and a **Link** button that copies a link applying the code at
  checkout.

## [1.1.0] - 2026-11-07

### Added

- **Application Forms** under Moderation, for staff with the new Manage
  Application Forms permission. Create forms, reorder them, and edit each
  one's name, description, tags and help link, whether it's open, hidden or
  needs our Discord server, how long applicants wait before applying again,
  and the message sent when they're approved. A question builder adds,
  rewords, reorders and removes questions, and sets each as a short or long
  answer. Built-in forms explain what they do automatically, and the
  questions they rely on are marked and can't be removed.
- A **Disciplinaries** page under Staff, for staff with Manage
  Disciplinaries. It lists what's waiting for approval (with a count in the
  sidebar), what's active, and the full history, with who issued, approved
  or lifted each one and why. Issue one to anyone ranked below you, and
  approve, deny or lift them from the list.
- **Leave and disciplinaries** on your Account page. Request leave from any
  type staff can request for themselves, with the length capped at the
  type's maximum, see what's active or waiting for approval, end your own
  leave early, and look back at your history.
- Staff members show their active leave or disciplinaries on the Members
  page.
- An **Account** page, opened from your profile card at the top of the
  sidebar. It shows your positions and when you joined staff, every device
  you're signed in on (with its browser, IP, and when it was last active),
  and lets you sign one out or sign out everywhere else. You can reset
  two-factor with a current code, and browse your permissions by category,
  with search and sensitive ones marked. Needs the matching Popplio release.
- Tickets open in the panel. Read the whole conversation, reply as
  yourself, and close or reopen the ticket without being signed in to the
  website. The list shows who opened each ticket and when the last message
  came in. Needs the matching Popplio release.
- The sidebar only shows pages you have the permission for, and opening one
  you can't use directly shows which permission it needs instead of an
  error.
- Browser tabs are titled with the page name, and pages with a pending
  count show it first, such as "(3) Review Queue".
- The Overview starts with what you've claimed in the queue and the oldest
  unclaimed bot and server, each linking straight to it in the queue. Cards
  and sections you don't have the permission for are left out.
- After approving or denying an application, the Applications page says
  what happened and shows anything that still needs doing by hand, such as
  giving an approved Staff Team applicant the Awaiting Staff role when they
  aren't in the Discord server yet.

### Changed

- Disciplinary Types explains what each type does: whether it replaces the
  member's permissions or adds to them, whether staff can request it, if it
  needs approval, and how long it can last. The edit form asks the same
  things in plain terms instead of "Additory" and "Self-assignable".
- You stay signed in for up to 12 hours without activity instead of 55
  minutes. Needs the matching Popplio release.
- A new sign-in page that fills the screen: what the panel is for on one
  side, over faint avatars of real bots listed on Omniplex, and the sign-in
  steps on the other. Phones get just the sign-in side. It now says that
  sign-ins and changes are logged.
- The top bar is gone. The logo, the button to collapse the sidebar and the
  theme switch moved into the sidebar, so pages get the full height of the
  window. On phones a slim bar keeps the logo and theme switch.
- The sidebar's collapse button no longer sticks out over the page.
- A redesigned Applications page. Pending applications are listed on the
  left, oldest first, with filters by position. The selected one shows the
  applicant's avatar, username, a copyable user ID, when they applied, a
  link to their profile, whether they're in the Omniplex Discord server,
  and numbered answers, with Approve and Deny pinned to the bottom.
- The Queue no longer has a Reviews button. Bots and servers waiting for
  review aren't public yet, so they can't have reviews.
- The note under the Queue's test invites now just says the safe invite adds
  the bot with no permissions.
- A redesigned Review Queue. Bots and servers are listed on the left,
  oldest first, with filters for unclaimed, claimed and your own claims.
  The selected one shows its warnings (moderation flags, an invite asking
  for Administrator, NSFW mismatches) at the top, the owner's note to
  reviewers (which the panel never showed before), its stats and the test
  invites, with Claim, or Approve, Deny and Unclaim, pinned to the bottom.
  The queue refreshes every minute and when you come back to the tab, and a
  claim that fails, for example because someone else got there first, now
  shows a message instead of replacing the page with an error.
- A redesigned Reports page: reports on the left, the selected one on the
  right with the reporter's and resolver's names instead of their IDs.
- Activity and RPC Logs show nested details as labelled fields instead of
  raw JSON.
- Dialog titles no longer use dashes, such as "Reviews of" and "Actions
  for".
- A redesigned Global Actions page. Pick the action from cards, choose what
  it applies to, and fill in the details, step by step. A summary spells
  out what will happen, and running it takes a second confirmation, since
  it changes every bot or server at once.

## [1.0.0] - 2026-11-05

### Added

- The staff panel as its own app, moved out of the website's `/admin`. It
  runs on its own domain, so staff sessions never share an origin with the
  user-written HTML on the public site. Pages sit at the root (`/queue`
  instead of `/admin/queue`), and sign-in sends Discord back to
  `/auth/callback`. Links to listings and tickets open on the website.
- A strict Content Security Policy: scripts need the page's nonce, the
  browser can only connect to the panel itself, Popplio, Arcadia and the
  CDN, and no page can be framed or embed frames. Search engines are told
  not to index it.
- A slimmer header with a theme switch and a link back to Omniplex.
- An **Activity** page: everything that changed on the site, from API
  changes by members, owners and API tokens to staff panel actions,
  payments, refunds, Auto-vote and background task failures. Users, bots,
  servers and teams show by name, with the ID in the event's details.
  Filter by source, actor, target, action or failed requests, open an event
  to see its details, and load older events as you scroll. Needs the View
  Audit Logs permission. The old page is now called **RPC Logs**.
- A **Payments** page in the Shop section, for staff with the new View
  Payments permission. The Premium tab lists recent purchases with how much
  premium each added, the credits and promo code used and any refund or
  dispute, with links to Stripe. The Auto-vote tab lists every subscriber
  and what each of their listings is waiting for: a cooldown, the schedule,
  a skip, or the next run.

### Changed

- Tickets load through Arcadia with the staff session, so the panel no
  longer needs you to be signed in to the website as well. Opening a ticket
  still takes you to it on the website.
