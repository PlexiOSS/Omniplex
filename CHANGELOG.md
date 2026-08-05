# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - Unreleased

### Fixed

- Staff Panel sign-in on prod failed with a misleading "Method Not Allowed"
  whenever `NEXT_PUBLIC_ARCADIA_URL` was configured with a trailing slash:
  `postQuery()` always appends its own `/`, so the request landed on a
  double-slash URL, which the panel API 301-redirects to the real path —
  and per the Fetch spec, a `POST` following a `301` is replayed as a `GET`,
  which the panel API correctly (but confusingly) rejects with
  `405 Method Not Allowed`. `ARCADIA_URL` now strips any trailing slash.

## [0.1.0] - 2026-08-04

### Added

- Downvotes: bot and server vote buttons now both show an upvote and a downvote control (bots previously only supported upvoting, both on the API and in the UI — see the matching Popplio change).
- Statistics: bot and server owners/team members can now view a "Stats" panel from the dashboard, showing votes, page views, invite clicks and (for bots) uptime check results — data the API already returned but the frontend never surfaced.
- A "Create" menu in the header (Add a Bot/Server/Pack, Create a Team), so those entry points are reachable from anywhere on the site, not just the footer and dashboard.
- Team management: Add Bot and Add Server now let you choose which of your existing teams (that you have the relevant `add_bots`/`add_servers` permission on) should own the new listing, instead of always creating a brand-new team. A new `/teams/add` page lets you create a team directly, linked from the dashboard's Teams tab and the footer. Since team names aren't unique, the picker shows each team's avatar and member/bot/server counts to tell same-named teams apart, and gains a search box once you have more than a handful of eligible teams.
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

- The entire frontend permission system was still built for Popplio's old
  `namespace.action` model (dotted strings, `*` wildcards, `~` negators,
  `global.*` for "grants everything") after the backend moved to flat,
  self-describing permission names (`edit_servers`, `manage_webhooks`,
  `owner`) with no namespaces, wildcards or negation. Every permission
  check across the team and staff/admin panel UI was comparing against
  names that no longer exist, so team owners (and staff) with correct
  permissions server-side could still be denied client-side, or see broken
  panels:
  - `lib/permissions.ts` rewritten for flat exact-match, with `owner`/
    `administrator` as the two domain "super" permissions that imply
    everything (was reimplementing full namespace/wildcard/negator parsing).
  - Every literal permission string across `dashboard`, `teams/[id]`,
    `teams/[id]/settings`, and the `/admin` staff pages (positions, queue,
    members) updated to its flat equivalent (e.g. `team_member.add` →
    `add_team_members`, `rpc.Claim` → `review_bots`, `global.*` → `owner`).
  - `PermissionData` (the shape of `GET /teams/meta/permissions` and
    `GET /staff/meta/permissions`) still had the old kittycat fields
    (`supported_entities`, `data_override`); the real response is
    `{id, name, desc, category, dangerous}`. This was the direct cause of
    `TypeError: s.supported_entities is not iterable` crashing the team
    settings page — something iterated a field that no longer exists.
  - `PermSelector` and `ArcadiaPermSelector` rewritten to group by the new
    `category` field instead of a namespace derived from
    `supported_entities`, and to toggle flat permission ids directly
    instead of building `namespace.perm` keys.
  - `ArcadiaPermSelector` additionally dropped negation support
    (`~permission`) entirely — the new model's overrides are purely
    additive (nothing subtracts from the union), so revoking a
    position-granted permission from a specific member is no longer
    possible from this editor; it now shows those as read-only ("via
    position") instead of offering a toggle that would silently do nothing.
  - Removed `lib/arcadia/permissionCatalog.ts`, a hand-maintained list of
    every permission string that existed because standalone Arcadia had no
    live catalog endpoint. Now that Arcadia is merged into Popplio, both
    `GET /teams/meta/permissions` and `GET /staff/meta/permissions` are
    real live endpoints (new `staff` API resource added), so the staff
    panel's permission pickers can't drift out of sync with the server the
    way the static list could.
- Server avatars showed the initials fallback everywhere (server cards,
  detail pages, widgets, OG images, pack pickers) — `IndexServer.avatar` was
  still typed and handled as `AssetMetadata` (the old CDN-asset shape from
  before that system was removed), while the backend now returns a plain
  URL string. Every consumer called `resolveAsset()` on it, which always
  returned `null` for a string, silently falling through to the fallback.
  `IndexServer.avatar` is now typed as `string` and used directly, matching
  `bots.avatar`. Team/partner avatars are unaffected — those are still
  genuinely removed, unlike servers'.
- `ARCADIA_PANEL_SCOPE`'s fallback value was `infinity-panel`, which doesn't
  match any OAuth2 scope Arcadia actually registers (`infinity-list`) —
  staff panel login failed OAuth validation for anyone relying on the
  default rather than an explicit `NEXT_PUBLIC_ARCADIA_PANEL_SCOPE` env var.
- The status page's "Staff Panel" check called `arcadia.auth.begin(...)`
  with a hardcoded production redirect URL (`https://omniplex.gg`)
  regardless of which environment was actually running. On staging, this
  sent the wrong origin to staging Arcadia's redirect validation, which
  legitimately rejected it — making a perfectly healthy panel API report as
  "May be affected". Now uses `BASE_URL` (already environment-aware) instead
  of a hardcoded value.
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
- The dashboard's Bots tab had no "Add a Bot" entry point, unlike the
  Servers/Teams/Packs tabs, which all had one in both their empty and
  populated states.
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
