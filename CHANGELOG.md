# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - Unreleased

### Added

- Knowledge base (`/kb`) section, with guide articles ported from the legacy
  site: Getting Started, Server Listing Rules, Pack Rules, Voting Rules & FAQ,
  and Partner Requirements.
- Full staff admin panel (`/admin`), backed by the Arcadia panel API:
  - Discord OAuth2 login with mandatory TOTP MFA.
  - Bot Queue with quick actions (Claim/Unclaim/Approve/Deny), a generic
    dynamic-form modal covering every other RPC action, submission-order
    position numbers, and safe (no-permissions) vs. submitted invite links
    shown side by side.
  - Global entity Search (bots/servers) with the same action modal.
  - Staff Positions and Staff Members management, with hierarchy-aware
    edit/delete locking.
  - A live + hand-maintained permission catalog and selector for granting
    staff permissions.
  - Pagination on the queue, search results, staff members list, and RPC
    audit log.
  - Overview page (`/admin`) summarizing bot/server/ticket counts, total
    users, and changelog count via Arcadia's `BaseAnalytics`. The Bot Queue
    moved to `/admin/queue`.
  - Bot Queue now resolves `claimed_by` Discord IDs to usernames via
    Arcadia's `GetUser`, instead of showing the raw ID.
- Reviews: star ratings and threaded replies on bots and servers, full
  create/edit/delete for the review's author, and a read-only view for staff
  in the admin panel.
- Packs can now include servers alongside bots, and any existing bot or
  server can be added to a pack regardless of who owns it — packs are
  curated lists, not ownership-restricted.
- Bot presence indicator (online/idle/dnd/offline) on bot cards and the bot
  detail page, sourced from a bot's self-reported status.
- `/about/status` now also monitors Packs, Blog, Search, and the Staff Panel
  API, on top of the existing checks.
- A reusable multi-link (`extra_links`) editor, wired into the bot add/edit
  forms and the new server add/edit forms — previously only a single
  synthetic invite link could ever be sent.
- A working "Add a Server" flow: paste a Discord invite link and the server
  is resolved and listed automatically. The previous version of this page
  called a backend endpoint that didn't exist.
- A dashboard "Servers" tab and `ServerEditModal` for managing servers owned
  by a team you belong to.
- Widget embed system (Markdown/HTML/URL snippets, customizable stats and
  colors) for bots, servers, and packs.
- The bot and server add forms now link to the relevant Knowledge Base rules
  (Bot Rules, Page Rules, Server Listing Rules) before submission.
- The staff Member edit modal now shows a member's positions and their full
  resolved permission set (positions + overrides combined), not just the
  override layer being edited.
- Add Bot and Add Server are now step-based flows, ported from the legacy
  site's pattern and extended with a confirmation step: enter an ID/invite
  and look it up, and a preview card shows the bot's real Discord
  name/avatar/server count/flags (or the server's name/icon/member counts)
  with a "Looks right — continue" / "Change" choice before the rest of the
  form unlocks — instead of blindly trusting whatever the submitter typed.
  Add Bot also carries over the legacy site's already-listed/not-public
  checks and the `fallback_bot_id` recovery path for when the anti-abuse
  provider is down.
- Add Bot and Add Server drafts are now persisted to `localStorage`, scoped
  to the signed-in user (`usePersistedFormDraft`), so an in-progress
  submission survives not just a refresh but closing the browser entirely.
  Unlike the legacy site's single global draft key, drafts are namespaced
  per user so they can't leak between accounts on a shared browser, and
  they're cleared automatically on a successful submit.
- Server owners can opt in ("Show this server's emojis & stickers") to
  displaying their server's custom emojis and stickers on its listing page,
  via a new toggle in `ServerEditModal`. The gallery only renders when the
  owner has opted in and there's actually synced data to show — nothing
  appears while the tracking bot isn't a member of the server.
- Add Server now warns (without blocking submission) when the tracking bot
  isn't currently a member of the server being added, with a direct invite
  link — several features (emoji/sticker sync, real invite generation, live
  member counts) silently never work otherwise, and previously nothing told
  the owner why.

### Changed

- `TagPicker` now always shows a listing's actual tags as removable chips,
  even when they fall outside the curated suggestion list, and supports
  adding free-form custom tags — tags were never restricted to an enum on
  the backend, so the old fixed-list picker could silently make existing
  tags disappear from the editor.
- `PermSelector` and `ArcadiaPermSelector` now surface any granted
  permission that isn't in their known catalog instead of hiding it
  entirely, so a permission the UI doesn't recognize is still visible and
  removable.
- `ArcadiaPermSelector` checkboxes now reflect a member's fully resolved
  permissions (position grants combined with overrides), not just the raw
  override array — a permission granted through a staff position now shows
  as checked (labeled "via position"), and unchecking it correctly emits an
  explicit per-member revoke (`~permission`) instead of doing nothing.
- Admin panel navigation is now part of the site's main header instead of
  running as a separate nav bar — one drawer-style menu across the whole
  site, admin section included, with an automatic "Staff panel" shortcut
  for staff and an "Exit staff panel" action while inside it.
- Homepage and About page bot totals now include certified bots, not just
  approved ones, so the two pages no longer disagree with each other.

### Fixed

- Markdown/HTML sanitizer:
  - `<style>`, `<svg>`, `<object>`, and `<embed>` are stripped along with
    their content, instead of leaving a `<style>` block's raw CSS visible as
    page text.
  - `margin-top`/`right`/`bottom`/`left` and `padding-top`/`right`/`bottom`/`left`
    (and the `auto` keyword inside shorthand `margin`/`padding`) were being
    silently dropped by the inline-style allowlist, breaking spacing on any
    custom-styled bio that used them.
  - Removed the forced divider auto-added under every `<h1>`/`<h2>`, which
    fought custom-designed descriptions that already had their own layout.
  - `<iframe>` embeds are now allowed (with a sane default height when the
    embed doesn't specify one), instead of being stripped outright.
  - `background` only ever validated a single flat color or a single
    gradient function — any bio layering a gradient over a solid fallback
    color, or stacking multiple gradients (a very common pattern for card
    backgrounds), had its entire `background` declaration silently dropped.
    Now validates each comma-separated layer independently.
  - `box-shadow`, `text-shadow`, `backdrop-filter`, `display:grid` /
    `grid-template-columns`, and the `flex` shorthand were entirely absent
    from the allowlist, silently dropping every declaration that used them.
    Elaborately-styled bios relying on any of these (card depth, blurred
    glass panels, responsive grid layouts) rendered as flat, stacked,
    unstyled blocks instead of the intended design.
- Dashboard tab bar could scroll vertically as well as horizontally on
  narrow viewports, due to a CSS `overflow-x`/`overflow-y` interaction.
- Bot/server/pack listing cards could force the whole page to overflow
  horizontally when tag or description content had no wrap point, due to
  CSS Grid items defaulting to `min-width: auto`.
- Team bots on the dashboard always showed "view only," even for users with
  full permissions on that team — traced to a Popplio bug (see Popplio's
  changelog) where team member data was never fetched for embedded teams.
- `TagPicker`'s custom-tag input rendered a nested `<form>` inside the
  page's own `<form>` (invalid HTML, React 19 hard-errors on it during
  hydration) — replaced with a plain input handling Enter directly.
- The team page and team settings form crashed outright for any team with
  no tags set (`team.tags` was `null`, not `[]`) — fixed on both sides: the
  Popplio response no longer sends `null` for this (see Popplio's
  changelog), and the frontend now defensively falls back to `[]` too.

## Backend integration notes

Some entries above required backend changes: 
- [Public API](https://github.com/InfinityBotList/Popplio)
- [Admin API](https://github.com/InfinityBotList/Arcadia)
