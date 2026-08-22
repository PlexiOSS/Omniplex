# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `useEntityPermission(targetType, targetId)` hook — centralizes the
  "resolve my permissions on this bot/server/team/pack" fetch that used to
  be hand-copied at every call site. The two copies had already drifted:
  `BotPageTabs` compared perms with a raw `.includes("edit_bots")` instead
  of `hasPermString` (broke for a direct owner, whose perms come back as
  `["owner"]`, a super-permission — the bug fixed a few versions back),
  while `TeamManageLink` didn't guard against a stale response landing
  after unmount at all. Both now use the hook; `teams/[id]/settings`
  deliberately wasn't migrated — it already used `hasPermString` correctly
  and its perms fetch is part of a larger coordinated load, not a
  standalone gate.
- `AdminListRow`/`AdminEmptyState` (`src/components/admin/AdminListRow.tsx`)
  and a promoted `StatCard` (`src/components/admin/StatCard.tsx`) — the
  "rounded card row with edit/delete actions" and "No X yet." markup was
  hand-duplicated across every admin CRUD list page (badges, blog, staff
  templates, and all five shop catalogs), and `StatCard` was local to the
  dashboard overview page only. Nine list pages now share the row
  component; `partners`, `staff/positions`, and `staff/members` weren't
  migrated since they each render a leading avatar or reorder-arrow column
  before the content that the row's two-slot (`children`/`actions`) API
  can't represent without changing their layout.
- Deep links to a specific review or bot changelog entry —
  `?review=<id>` on a bot/server page and `?changelog=<id>` on a bot page
  jump straight to the reviews/changelog tab (even without an explicit
  `?tab=` param) and scroll the matching entry into view with a temporary
  ring highlight. New `useHighlightScroll` hook
  (`src/hooks/useHighlightScroll.ts`) does the `scrollIntoView` on mount;
  `ReviewsSection` and `BotChangelogSection` both take an optional
  `highlightId` prop. Previously the only way to point someone at a
  specific review or update was "open the bot page and scroll."
- NSFW compliance badges on the review queue's server cards: an "Ungated
  NSFW" warning when Popplio reports age-restricted channels but the server
  isn't tagged `nsfw`, a "No gated channels" note when it's tagged `nsfw`
  but none were detected, and a gated-channel count alongside vote/member
  counts otherwise. Backed by Popplio's new `discord_nsfw_level`/
  `nsfw_channel_count` fields on `PartialServer` (synced by Infernoplex).
  Previously answering "Server: NSFW Content Not Gated" meant a reviewer
  joining the server and looking around by hand.
- "Moderation flagged" badge on both bot and server queue cards when
  OpenAI's moderation endpoint flagged the submitted description, with the
  flagged categories in the tooltip. Backed by Popplio's new
  `moderation_flagged`/`moderation_categories` fields on `PartialBot`/
  `PartialServer` — a signal for reviewers, not an auto-reject.

### Changed

- The queue page's Claim/Unclaim/Approve/Deny buttons now gate on
  `review_entities` instead of `review_bots`, matching Popplio's renamed
  staff permission (the RPC actions they gate have always covered both
  bots and servers; only the name was bot-specific). **Must ship no
  earlier than Popplio's `review_bots` → `review_entities` rename** —
  deploying this before that lands means `hasPerm("review_entities")`
  never matches anyone's resolved perms, since the backend would still be
  returning `review_bots`.

### Fixed

- `/admin/templates` and `/admin/badges` weren't linked from the admin
  nav — added "Templates" next to "Badges" under Content in
  `Header.tsx`'s `ADMIN_NAV_LINKS`.
- An instance owner holding no explicit staff position (common — owners
  come from Popplio's config, not a `staff_positions` row) showed every
  position as "Locked," including ones they should always be able to
  edit. `staff/positions` and `staff/members` both derived a "my lowest
  index" from `staffMember.positions`, defaulting to `Infinity` for an
  empty array — indistinguishable from an owner who legitimately
  outranks everyone. Now reads the new `staffMember.rank`/`member.rank`
  field Popplio exposes instead of re-deriving it.

- `/admin/templates` — a new admin page for the staff-template catalog
  (pre-built answers used when approving/denying a bot or server), with
  create/edit/delete and a bot/server filter. Previously there was no way
  to manage these at all short of a manual DB insert; backed by Popplio's
  new `UpdateStaffTemplates` panel op.
- Certify, Premium, and the new Feature staff actions now work on servers
  as well as bots — no new frontend needed for this specifically, since
  the admin panel's Actions menu (`GenericRpcModal`) is already fully
  data-driven off Popplio's `GetRpcMethods` response.

## [0.2.2] - 2026-08-18

### Added

- Bot and server pages now surface a "Voters" tab of their own, split out
  of what used to be bundled at the bottom of Reviews — the voter list now
  shows its own loading/empty state instead of just disappearing when
  there aren't any yet.
- `/emojis` is now tabbed (Emojis / Stickers) with a search box, backed by
  two new flat, item-level-paginated Popplio endpoints
  (`GET /servers/@emojis/flat`, `GET /servers/@stickers/flat`) instead of
  one page per server — the old per-server layout meant the page would
  only ever get more cluttered as more servers opted in, and which server
  an emoji came from isn't really the organizing question people have
  when browsing.
- Emoji/sticker tiles (on both the flat browse page and a server's own
  page) are now click-to-copy, and animated ones actually render as
  animated — including Lottie stickers, which were previously dropped
  entirely since there's no plain `<img>` for a Lottie JSON animation
  (now rendered via `lottie-react`).
- Server pages are now tabbed (About / Emojis & Stickers / Reviews /
  Voters) instead of one long scroll, matching the bot page's tab
  treatment.
- Every paginated list in the app (bots, servers, shop, admin
  queue/logs/staff, webhooks, notifications, search — all share one
  `Pagination` component) now has a jump-to-page input alongside
  Previous/Next.
- The dashboard's bot card menu now has direct "Commands" / "Changelog"
  links (`/bots/{id}?tab=commands`, `?tab=changelog`) — those tabs
  already existed on a bot's public page from the last release, but
  nothing linked to them, so owners had no way to discover the feature
  existed.

### Fixed

- A direct bot owner (not acting through a team) never saw the
  Edit Commands / Post Update buttons on their own bot's page — the
  permission check compared the returned perms array against the literal
  string `"edit_bots"`, but a direct owner's perms come back as `["owner"]`
  (a super-permission), not the expanded list. Now uses the same
  `hasPermString` helper every other permission check in the app already
  uses, which understands `"owner"` implies everything.
- Public profiles were missing any bot or server owned through a team —
  `user_bots`/`user_servers` only cover direct ownership; team-owned
  entities live under `user_teams[].entities` instead (the same place the
  dashboard already reads them from). The profile page now merges both.
- Animated emojis showed a "this is animated" indicator but never actually
  moved — traced to Popplio: `disgo`'s `Emoji.URL()` always defaults to a
  static PNG regardless of the `animated` flag (unlike `Sticker.URL()`,
  which already inferred the right format). Fixed server-side; existing
  already-synced emoji URLs pick up the fix on the next periodic sync,
  not retroactively.
- Server member/online counts were permanently frozen at whatever they
  were the moment a server ran `/setup` — there was no periodic refresh
  at all, since the bot deliberately doesn't hold the privileged Server
  Members intent (so the gateway's cached count never updates live
  either). The existing 30-minute server-sync task now also REST-polls
  each server's live approximate counts, the same way `/setup` originally
  got them.

## [0.2.1] - 2026-08-17

### Added

- The `/shop` page now shows the sitewide vote credit tier ladder (`GET
  /votes/credit-tiers`, not scoped to an owned entity) and a paginated
  vote history for the selected bot/server (`GET
  /users/{id}/{target_type}/{target_id}/votes/@all`) — both existing
  endpoints had no frontend caller before.
- `/premium` now checks Stripe's configured-key endpoint (`GET
  /payments/stripe`) before showing "Pay with Card", the same
  hide-if-unconfigured treatment PayPal already got. If neither provider
  is configured, the page says so instead of showing a button that would
  just fail at checkout.
- A "Refresh" button on the dashboard's profile tab clears the cached
  Discord username/avatar for the signed-in account (`DELETE
  /platform/user/{id}?platform=discord`), for when it looks stale before
  the next natural resync.
- A "Notifications" dashboard tab (`/dashboard?tab=notifications`) showing
  the full, paginated notification history with per-item mark-read and
  delete, plus a "Clear all" action — all backed by existing Popplio
  endpoints (`GET /users/{id}/alerts`, the `PATCH` `delete` action,
  `DELETE /users/{id}/alerts`) that had no frontend caller before. The
  notification bell now only shows unread alerts (no more dimmed read
  items sitting in the dropdown) and links to this tab as the place to
  review or clean up history.
- `/admin/queue` is now split into Bots / Servers tabs (same underline-tab
  treatment used elsewhere in the panel). Servers now go through the same
  claim/approve/deny/unverify review flow bots always have — backed by
  Popplio's new `ServerQueue` panel op and `Server` support on the
  existing review RPC actions.
- A `/banned` page and a ban-appeal login path. Popplio already rejected
  every authenticated request from a banned user except sessions scoped
  `ban_exempt`, and already had a `banappeal` application position built
  for exactly this — the frontend just never used any of it. A banned
  login attempt now offers "Continue to appeal" instead of a dead end,
  `/banned` shows the appeal form (or its status, if one's already been
  submitted) via the existing Applications system, and any page catches an
  already-active session that gets banned mid-visit and redirects there.
- `/admin/badges` — a catalog admin page for the new generic badge system
  (name, description, icon, color, which entity types it applies to).
  Awarding a badge to a user, bot, server, or team happens through the
  existing Actions menu in Search/Report detail (new `AssignBadge`/
  `UnassignBadge` RPC action, fully data-driven like every other staff
  action — no extra frontend needed there). Public user profiles now show
  any badges a user's been awarded, alongside the existing Staff/
  Certified Dev/Bot Developer/Bug Hunter badges.
- Bot pages are now tabbed (About / Commands / Changelog / Reviews)
  instead of one long scroll. Commands and Changelog are new — a bot's
  owner or team can document its commands (grouped by category) and post
  update/announcement entries, with inline "Edit Commands" / "Post
  Update" affordances that only show up for someone who actually has
  edit rights on that bot (checked via the existing entity-permissions
  endpoint, not a new one).
- Five new admin pages under `/admin/shop` (Items, Benefits, Vote Credit
  Tiers, Coupons, Bot Whitelist). Arcadia's shop-administration panel
  actions had no frontend caller at all what's purchasable, what buying
  it grants, coupon codes, vote-credit conversion rates, and the bot
  whitelist could only be edited by hand in the database. The Benefits
  and Items pages flag benefit IDs the purchase flow doesn't actually
  recognize (`routes/shop/assets/benefits.go`'s fixed set) as
  "display only," so staff don't create a benefit that's purchasable but
  silently does nothing. The Coupons page notes plainly that coupons
  aren't wired into checkout yet this only manages the catalogue.
- `/admin/shop/purchases` — the last 100 shop purchases platform-wide, for
  abuse/fraud monitoring (`GET /staff/shop-purchases`, which already
  existed server-side with no caller, same shape as the earlier
  `GET /staff/tickets` gap).
- The bot Queue's Approve/Deny reason box can now quick-fill from a staff
  review template (`GET /list/staff-templates`, previously unused) —
  filtered to the right kind (`approval` templates for Approve, `denial`
  for Deny), confirmed against the real seeded rows rather than guessed.
- Sign-in on beta and staging now surfaces a clear message when it's
  rejected for not holding the Bug Hunter role, instead of a generic
  login-failure error (matches Popplio's new `checkBugHunterOnly` gate).

### Fixed

- Every image on every page load forced a network round trip: `/cdn/[...path]`
  served `Cache-Control: max-age=0, must-revalidate`, and even that
  revalidation pulled the *entire* object down from RustFS via `GetObject`
  before checking `If-None-Match`, just to discard it on a 304. Now uses
  `HeadObject` for revalidation (no body transfer) and
  `max-age=60, stale-while-revalidate=300` (instant from browser cache for
  a minute, refreshed in the background after) — a re-upload is still
  visible within about a minute, but repeat page loads no longer touch the
  network per image.
- Public user profiles (`/user/[id]`): the Bots/Servers/Packs/Teams
  selector now uses the same underline-tab treatment as the dashboard's
  own tab bar (icon, label, count badge, accent underline) instead of a
  pill toggle borrowed from the homepage's narrower bot/server switcher.
- The notification bell (`NotificationBell.tsx`) called
  `GET /users/{id}/alerts/@featured` with no query string, but Popplio
  requires `acked_count`/`unacked_count` as integers every request
  400'd, silently swallowed by a bare `catch {}`. The bell has shown
  nothing since it was built, independent of the earlier `NoSave` fix.
  Now sends both with sensible defaults.

## [0.2.0] - 2026-08-16

### Added

- Admin Search (`/admin/search`) now covers every entity type bots,
  servers, packs, teams, and users instead of just bots and servers,
  each with its own Actions menu (backed by Popplio's newly-extended
  `SearchEntitys`).
- A `/staff` knowledge base section (redirects to a new `staff` KB
  category) covering the real staff hierarchy, the full permissions
  reference, how reports/tickets/applications actually reach staff, and
  staff conduct/transparency all sourced directly from the live
  `staff_positions` table and Popplio's permission catalogue, not
  guessed. Linked from the footer.
- Public user profiles (`/user/[id]`) now show a user's servers and every
  public link they've added, not just Bots and a hardcoded website/GitHub
  pair. New shared `TeamCard` component (also now used on the dashboard's
  Teams tab, replacing a near-identical inline copy) so Teams can be
  shown too. The "hasn't listed anything" empty state now checks bots,
  servers, packs, and teams together instead of just bots.
- Report detail (`/admin/reports`) now shows the actual bot/server/pack/team
  the report is about — icon, name, and a link straight to its listing —
  instead of just the raw target type/id. An "Actions" button next to it
  loads Arcadia's staff RPC methods filtered to whatever that target type
  actually supports (e.g. force-removal for bots) via the new, reusable
  `GenericRpcModal`, so resolving a report and actually acting on the
  reported content no longer requires leaving the modal.
- "Platform safety" stats (banned users, vote-banned bots) on the
  Moderation Transparency page (`/about/moderation`), backed by Popplio's
  extended `GET /list/stats`. Styled as its own card-grid section,
  matching the existing "Bot review pipeline" section the reports table
  itself is unchanged.
- A "Support Tickets" check on the Status page (`/about/status`), backed
  by the public `GET /tickets/topics` endpoint.

### Fixed

- Team/server/bot avatar and banner updates weren't reflecting instantly
  after upload — Next's image optimizer was caching the old asset
  in front of already-correct origin cache headers. `Avatar`/`Banner` now
  render with `unoptimized`, since every source is already our own CDN
  proxy or Discord's hash-versioned CDN.
- The dashboard's profile editor (`EditProfileTab`) had its own,
  slightly-different links list (different remove icon, different "Add
  link" button style) instead of the shared `LinksEditor` component every
  other edit form already uses — now reuses it.

### Changed

- Admin panel nav decluttered: Queue, Applications, Reports, and Tickets
  are now grouped under a single "Moderation" dropdown instead of four
  separate top-level links.
- Dashboard bot/server cards moved the "Upgrade" and "Shop" actions into
  the existing "..." menu, keeping only View/Edit inline, to cut down on
  how crowded each card had gotten.
- API Tokens tab (`TokenManager`) now puts the "Create Token" button and
  count at the top, with the create form appearing directly below it
  instead of at the bottom of the list; button variant matched to the
  `secondary` convention used by Teams/Packs/Applications.
- Security tab cards given filled backgrounds and the same heading
  weight/size as the rest of the dashboard, and laid out side-by-side on
  wide screens instead of stacked in a narrow column.
- Consistency pass across the admin panel: list spacing, card padding, and
  hover treatment brought in line across Applications, Queue, and Tickets;
  removed the deprecated, permanently-zero "Changelogs" stat from the
  admin Overview page; Dashboard Overview's stat tiles restyled to match
  the admin panel's icon+label convention.

## [0.1.4] - 2026-08-15

### Fixed

- The Exit Panel button was desktop-only (`hidden md:block`) and, on
  mobile, only reachable by opening the hamburger menu — not a persistent,
  obvious way back to the main site from anywhere in the admin panel.
  Replaced with an always-visible icon button in the header's icon row
  (same treatment as Customize/notifications/theme), on both desktop and
  mobile.

### Added

- `/admin/tickets` — a staff ticket queue, filterable by open/closed. The
  API and even a working staff-capable thread view already existed
  (`/tickets/{id}` already grants any staff member with `view_tickets`
  view/reply access, and `manage_tickets` for reopening — confirmed by
  reading `get_ticket`'s existing owner-or-staff check), so this just adds
  the missing "find a ticket to act on" step: list view backed by
  Popplio's new `GET /staff/tickets`, each row linking straight into the
  existing `/tickets/{id}` page rather than a new detail view.

## [0.1.3] - 2026-08-15

### Added

- A "Security" tab on the dashboard (`src/app/dashboard/SecurityTab.tsx`)
  exposing Popplio's data-export/account-deletion pipeline
  (`POST /users/{id}/data`), which existed server-side with zero frontend
  consumer until now — closes the loop on the Privacy Policy's "Your
  rights" section, which previously only pointed at a support ticket for
  something that can be self-service. Download builds a per-table
  row-count summary plus a client-side JSON download from the completed
  task's output; deletion requires typing your exact username in a modal
  before it's enabled, since it's a real, irreversible
  `DELETE FROM users`. Both poll `GET /users/{id}/tasks/{tid}` every 2s
  (task id/key persisted to `localStorage` so a page refresh mid-poll
  resumes instead of losing the reference), capping at 5 minutes before
  telling the user to check back later rather than erroring.
- Vanity URL self-management: `BotEditModal`/`ServerEditModal` gained a
  "Vanity URL" field wired to `PATCH /{target_type}/{target_id}/vanity`
  (`vanityResource.update`), previously a read-only value in the UI
  despite the endpoint existing. Server-side validation errors (taken,
  blacklisted, contains `@`) are surfaced verbatim rather than
  reimplemented client-side.
- A "Recent voters" section (`src/components/votes/VoterList.tsx`) on bot
  and server pages, backed by the public
  `GET /{target_type}/{target_id}/votes/user-list` endpoint (bare Discord
  snowflakes, no auth needed) which had no frontend consumer before this.
  Resolves the first 12 voters to a username/avatar via `users.getUser`
  (`Promise.allSettled`, falls back to the raw ID if resolution fails for
  any one voter) with a "+N more" tail count from a real paginated total.
- A staff "Applications" review page (`/admin/applications`) for the 7
  positions registered in Popplio's `/apps` system (certification,
  partnership, server certification, staff, ban appeals, etc.) — the
  `PATCH /staff/apps/{id}` approve/deny endpoint had no staff-facing UI
  anywhere before this, not even in Arcadia as far as this workspace can
  tell. Required adding a new Arcadia RPC wrapper,
  `arcadia.popplioStaff()` (`src/lib/arcadia/client.ts`), mirroring
  Popplio's own `popplioStaff` proxy action
  (`popplio/arcadia/panel/ops_proxy.go`) that relays a request into
  Popplio's legacy-header-gated `/staff/*` API and returns its status/body
  verbatim — this wasn't hand-ported into Omniplex's Arcadia client until
  now, so nothing could reach `/staff/apps*` at all despite the backend
  bridge already existing. Approve/deny is otherwise fully
  server-side-driven (grants/unbans happen inside Popplio's own handler);
  the page only submits `{approved, reason}` and refetches.
- A self-hosted Legal hub at `/legal`, replacing the Footer's links out to
  `nodebyte.co.uk/legal/*`. Four documents written fresh for what Omniplex
  actually does rather than adapted from the parent brand's general-purpose
  pages: Terms of Service, Privacy Policy, Acceptable Use (the single
  authoritative version of conduct rules that were previously scattered
  across a few KB articles), and a Service Agreement covering premium/shop
  purchases and refunds. Same markdown+frontmatter pattern as the
  Knowledge Base (`gray-matter`, rendered through the existing `Markdown`
  component), but flat (`src/content/legal/*.md` → `/legal/[slug]`) since
  there's no category nesting to model. Two KB articles
  (`bots/rules.md`, `servers/listing-rules.md`) already linked to
  `/legal/terms` as if it existed; that link now resolves instead of
  404ing. Added to the sitemap alongside everything else.
- The Friday-Sunday double-vote weekend bonus is now actually visible:
  `VoteButton`/`ServerVoteButton` show a "Double-vote weekend" banner
  above the vote buttons when it's live and the entity isn't premium
  (premium already gets a flat shorter cooldown instead). The bonus check
  now reads UTC (`getUTCDay()`) rather than the viewer's local day, to
  match Popplio's now-explicit UTC pinning (see Popplio's changelog) —
  previously the local-time check could disagree with the server near a
  day boundary depending on the viewer's timezone. Voting Rules also now
  states the boundary is UTC, not just "Friday through Sunday".
- Premium and Shop now work for servers, matching bots (backend change,
  see Popplio's changelog for the full breakdown — servers previously had
  a `premium` field and a "Certified" badge with no way to actually earn
  either):
  - `/premium` and `/shop` both gained a Bot/Server toggle; picking Server
    lists servers from your teams instead of your own bots, and every
    checkout/purchase call now sends the target type through.
  - `ServerCard`, the server detail page, and the dashboard's server
    cards all get the same Supporter badge / Vote Blitz banner / Upgrade
    + Shop buttons bots already had.
  - `/apps` gained a "Server Certification" position alongside the
    existing bot one.
- Certification requirements got more lenient and multi-metric instead of
  a strict two-thresholds-at-once bar (see Popplio's changelog) —
  Certification and Partner Requirements in the Knowledge Base rewritten
  to match, and to note certification now covers servers too.
- Knowledge Base coverage for everything shipped this cycle that had none:
  three new categories — **Account** (Alerts & Push Notifications, Vote
  Reminders), **Premium & Shop** (Premium Plans & Checkout, Vote Credits &
  the Shop), **Support** (Support Tickets) — plus a new **How to Apply**
  article in Programs covering the `/apps` mechanics that Certification
  and Partnership used to each describe informally. Also fixed three
  articles that had gone stale from earlier work this cycle:
  Partnership's "How to apply" still pointed at Discord instead of the
  in-app form, Voting Rules' "Vote credits" section predated the Shop and
  called credits opt-in (they're not), and Getting Started's pack step
  only described bot packs, not the server/emoji pack types packs have
  supported for a while.
- Home page rebalanced toward servers, which previously only got one
  section (Top Servers) against four bot-only ones:
  - The hero headline now rotates through "bots" / "servers" / "packs"
    (`RotatingWord`, crossfades in place with no layout shift, extra
    words are a one-line addition later) instead of hardcoding "bots".
  - `HomeTabs` gained a Bots/Servers toggle alongside its existing
    Top Voted/New/Most Viewed tabs, using server index data
    (`servers.getIndex()`) that was already being fetched but mostly
    unused.
  - Certified and Premium sections (previously bot-only, with servers'
    certified/premium data fetched but never shown) are now a single
    "Spotlight" block using the same toggle, replacing three separate
    sections with one.
  - The standalone "Top Servers" section was removed since the Bots/
    Servers toggle on the main tabs now covers the same ground.
  - The main tabs gained a "Random" tab backed by Popplio's `/bots/@random`
    and `/servers/@random` (both existed already; `bots.getRandom()` was
    even already written but never called anywhere, and there was no
    `servers.getRandom()` at all until now). Re-rolls client-side on every
    visit to the tab, with a manual shuffle button to draw again.
  - The home page's "Packs" section (renamed from "Bot Packs", since packs
    have supported bot/server/emoji for a while) and the Featured Bots
    section were showing only 6 cards despite Popplio returning up to
    9/12 — now show 9, matching the Top Voted/Certified/Premium tabs,
    which were already at 9 on both ends.

- Moderation Transparency page now shows a bot review pipeline (Approved /
  Certified / Awaiting Review / Denied) alongside the existing report
  counts. Popplio's `/list/stats` gained `total_pending_bots` and
  `total_denied_bots` to back it — everything else on the page was already
  public data, this just closes the last gap.
- The "Bots" stat on the home page and the "Listed Bots" / "Total
  Submitted" stats on the About page now consistently read `total_bots` —
  every bot ever submitted, not just the approved ones — so the same
  number shows everywhere instead of quietly differing by page.
- Applications — staff, dev team, partnerships, and certification have had
  a full submit-and-review pipeline in Popplio that nothing in Omniplex
  ever surfaced. New frontend-only surface:
  - `/apps` lists open positions pulled live from Popplio (tags, a short
    teaser, closed/open state).
  - `/apps/[id]` renders each position's full description and a form built
    dynamically from its question set (short answers vs. long-form,
    matching the backend's own length rules so validation errors are rare
    by the time it hits the server).
  - A new "Applications" tab on the dashboard lists everything a user has
    submitted, with state (Pending/Approved/Denied) and any staff feedback
    once reviewed.
- Premium Popplio's Stripe/PayPal checkout and booster-offer redemption
  have been fully wired backend-side with nothing in Omniplex to start a
  purchase. New:
  - `/premium` lists the Bronze/Silver/Gold plans, lets you pick one of
    your own approved/certified, not-yet-premium bots, and pay with card
    (Stripe Checkout) or PayPal — both just redirect to the provider's
    hosted checkout, no card data ever touches Omniplex. Server boosters
    get an extra "redeem free" option on the Bronze plan.
  - `/payments/success` and `/payments/cancelled` — Popplio's Stripe and
    PayPal flows redirect back to these by hardcoded URL, so they had to
    exist for checkout to complete at all.
  - An "Upgrade" button on eligible bots in the dashboard's Bots tab links
    straight into `/premium` with the bot preselected.
- Shop — votes on a bot have always converted into a spendable credit
  balance in Popplio, but there was never anything to spend them on. Now
  there is, backed by five new Popplio-side effects (see Popplio's
  changelog for the full list — bonus premium days, a priority-placement
  boost, a featured homepage slot, a cosmetic Supporter badge, and a
  vote-cooldown-halving blitz):
  - `/shop` — pick one of your bots, see its available credits, convert
    unredeemed votes into credits, and buy any item its balance covers.
  - A "Featured Bots" section on the home page and a "Supporter" badge on
    bot cards/pages now show the two benefits that have a visible effect
    beyond stats you'd have to go looking for; a Vote Blitz banner appears
    on a bot's page while one is active.
  - A "Shop" button next to "Upgrade" on every bot in the dashboard's
    Bots tab.

- Alerts & push notifications — Popplio has had a complete notification
  pipeline (per-user alert inbox, VAPID web push subscribe/unsubscribe,
  a live cron firing real push notifications when a vote reminder comes
  due) that Omniplex never consumed until now. No backend changes needed,
  this is entirely new frontend surface:
  - A bell icon in the header (signed-in only) opens a dropdown showing
    recent alerts (`GET /users/{id}/alerts/@featured`), each dismissible
    individually or via "Mark all read", with an unread-count badge.
  - `usePushNotifications` (new hook) handles the actual browser
    subscribe flow: registers `public/sw.js` (a minimal, dependency-free
    service worker — push/notificationclick handlers only, deliberately
    outside the Next.js build pipeline), requests notification
    permission, fetches the VAPID public key
    (`GET /users/notifications/info`), and posts the resulting
    `PushSubscription` to Popplio. Surfaced as an Enable/Disable toggle
    inside the bell dropdown, with a plain "not supported" state for
    browsers without Push API support.
  - `ReminderToggle` (new component, generic over bot/server) on bot and
    server detail pages next to the report button — "remind me to vote
    for this again," backed by Popplio's existing reminders API, checks
    current state on mount so it renders correctly whether or not a
    reminder already exists.
  - `Dropdown` gained an optional `panelClassName` prop (defaults to the
    existing `w-44`) so the alert panel isn't squeezed into a menu-width
    box.
- `/shop` now shows purchase history — the endpoint and API resource
  existed from the original build but were never actually rendered
  anywhere.
- Support Tickets — Popplio gained a full standalone ticket system (see
  its own changelog), surfaced here as `/tickets` (your open/closed
  tickets), `/tickets/new` (topic picker + subject + message form), and
  `/tickets/[id]` (thread view — reply while open, close any time, reopen
  if you're staff).
- A round of visual consistency work:
  - `BotCard`/`ServerCard` now get a subtle accent-tinted gradient
    background and border when premium, certified, or (bots only)
    Supporter-badged, instead of blending into the same plain gray border
    as every other card.
  - The home page's Featured and Spotlight sections got a matching
    accent-tinted band background, since they're literally the paid/
    hand-picked real estate on the page.
  - `OmniplexLogo`'s brand-accent shape now fills with `var(--accent)`
    instead of a hardcoded `#4943cb`, so the logo itself follows whatever
    accent color a user has picked in Customize.
  - `HomeTabs` and `/search`'s tag filter chips now use the same
    `bg-accent/10 text-accent` / `bg-accent text-accent-fg` active-state
    styling the rest of the app (`/bots`'s Newest/Trending toggle, the
    dashboard's tab bar) already used — both were quietly still on plain
    black/white or gray.
  - `HomeTabs`' tab strip and its Bots/Servers toggle no longer wrap onto
    a second row on narrow screens; the tab strip scrolls horizontally
    inside its own flexible region instead, with the toggle pinned to the
    right on the same line.
  - The hero's rotating word (`RotatingWord`) no longer stacks onto its
    own line for longer words like "servers"/"packs" — it stays inline
    with "Discover the best Discord" the way the static "bots" text
    always did.
- `/search`'s query box now nudges toward `/premium`, `/shop`, `/apps`,
  or `/tickets` when the search text looks like it's after one of those —
  Popplio's search index only ever covers bots/servers (confirmed in
  `types/search.go`), so a query for "premium" or "ticket" would
  otherwise just come back with an empty/irrelevant result set instead of
  pointing anywhere useful.

### Fixed

- `PackCard`'s avatar stack (bot and server packs alike) read
  `bot.user.avatar`/`server.avatar` directly instead of going through
  `mirroredAvatarUrl` like every other avatar in the app — some of those
  raw URLs 403 through the CDN mirror's stale-URL handling, which is why
  a pack with 4+ real bots could show fewer real avatars than expected in
  its card preview while the pack's own detail page rendered them all
  fine (it already went through `BotCard`/`ServerCard`, which never had
  this bug).

## [0.1.2] - 2026-08-14

### Added

- Packs now come in three flavors — Bot, Server, and Emoji — instead of
  bots-only. `/packs/add` gains a pack-type selector as its first step;
  bot/server packs reuse the existing search-and-pick flow restricted to
  one type at a time, while emoji packs get a new upload sub-flow
  (`EmojiPackBuilder.tsx`, up to 50 emojis, 256KB each, static or animated
  GIF) built on the existing `/api/uploads` gateway (new `pack-emoji` kind,
  gated by a new `edit_packs` permission check against Popplio). Emoji
  images live at a deterministic CDN path (`packEmojiUrl()`, same
  convention as `bannerUrl()`) rather than a database-stored URL. Pack
  cards, the pack detail page, and the `/packs` listing (now filterable by
  `?pack_type=`) all show a `PackTypeBadge` and type-appropriate preview.
- A "Report this pack" flow (`components/reports/ReportModal.tsx`, built
  generic over target type so bots/servers can reuse it later) for
  flagging license/ToS violations, spam, or anything else — motivated
  specifically by user-created emoji packs raising real rights questions.
  Reports are reviewed by staff only, at a new `/admin/reports` page
  (status-filterable queue + detail modal with Resolve/Dismiss and an
  optional note) gated on a new `review_reports` permission — reporter
  identity is visible there and nowhere else; a pack owner never learns
  who reported them, only that a report exists and its reason category.
- `ReportModal` rolled out to bot and server detail pages, not just packs —
  it was already built generic over target type for exactly this.
- An RSS feed for `/changelog` (`/changelog/rss.xml`), hand-built (no
  existing precedent in this repo for a manual XML route — sitemap/robots
  use Next's typed `MetadataRoute` convention, which has no RSS
  equivalent) from the same `getChangelogEntries()` the page itself uses,
  same 15-minute cache window. Linked from the changelog page header and
  its metadata (`<link rel="alternate" type="application/rss+xml">`).
- A "Trending" sort on `/bots` and `/servers`, alongside the existing
  newest-first default — ranks by net votes in the last 7 days (via
  Popplio's new `?sort=trending` param) instead of raw vote count, so a
  bot/server picking up votes right now surfaces even if its all-time
  total is small.
- `/about/moderation`: a public, anonymized breakdown of content reports
  by reason and status (counts only — no report/target/reporter
  identity), backed by Popplio's new `GET /reports/stats`. Linked from
  `/about` and the footer, next to the existing status page link.
- `/emojis`: a browse page aggregating custom emojis/stickers across every
  server that's opted in to showing them (`show_emojis`), grouped by
  source server and reusing the existing `EmojiStickerGallery` card
  treatment. Backed by Popplio's new `GET /servers/@emojis`, since the
  regular paginated server listing excludes emoji/sticker data entirely.

### Fixed

- Uploaded images (banners, avatars, pack emojis — anything served through
  `/cdn/[...path]`) could stay visibly stale for up to a day after a
  re-upload: the fixed per-entity URL never changes, but the response was
  cached `max-age=3600, stale-while-revalidate=86400`, so a browser (or
  anything in front of it) could keep serving the old bytes long after a
  new upload landed. The route now sets `max-age=0, must-revalidate` and
  compares the request's `If-None-Match` against RustFS's own ETag (now
  captured in `getObject`) — an unchanged image gets a bodyless 304 (cheap,
  effectively instant), a changed one gets the new bytes on the very next
  request instead of waiting out the old cache window.

### Security

- `/cdn/avatar-mirror/[targetType]/[id]`'s `?src=` param was passed
  straight to `fetch()` with no validation (CodeQL `js/request-forgery`)
  — since this route is public and unauthenticated, anyone could point
  `?src=` at an arbitrary internal URL and make the server fetch it, and
  the response would then get `putObject`'d into the shared bucket at a
  predictable path, serving whatever the attacker's URL returned to every
  future visitor of that avatar. `?src=` is now checked against an
  allow-list of exactly `cdn.discordapp.com` (the only host dovewing ever
  actually resolves an avatar to) before the fetch happens at all, not
  after.

## [0.1.1] - 2026-08-13

### Added

- New public `/changelog` page, replacing the old database-backed changelog
  system (`popplio`'s `changelogs` table, `arcadia/panel/ops_content.go`'s
  `updateChangelog` RPC, and the `ChangelogAction` DTOs) — that system was
  already fully dead: the RPC unconditionally returned 403 "not
  implemented", the panel's "Changelogs" stat was hardcoded to 0, and there
  was no route or admin UI on either side. `/changelog` instead pulls
  releases directly from GitHub (`lib/github/releases.ts`) for a
  configurable list of repos (`lib/github/config.ts` — currently Popplio
  and Omniplex itself), merges them into one reverse-chronological
  timeline with a per-repo filter, and renders each release's body through
  the existing sanitized `Markdown` component. No new database or admin
  surface — GitHub Releases *is* the source of truth now, cutting a release
  there is the entire authoring flow. Cached for 15 minutes
  (`next: { revalidate: 900 }`) to stay off GitHub's unauthenticated rate
  limit without needing a redeploy to pick up a new release; set
  `GITHUB_TOKEN` (server-only) to raise that limit if it's ever hit.
- Real image hosting, replacing the informal legacy-CDN-path guessing used
  everywhere so far (`bannerUrl`/`partnerAvatarUrl`/`teamAvatarUrl`
  previously just hoped a file existed at a fixed path, with no way to add
  new ones). The old on-disk `cdn.omniplex.gg` static files were migrated
  into a private RustFS (S3-compatible) bucket; since it's private, none of
  it is reachable directly, so everything now goes through two new
  same-origin proxy routes that hold the only S3 credentials (server-side
  only, never shipped to the client):
  - `/cdn/[...path]` — serves uploaded assets (partner logos, team
    avatar/banner, bot/server banner) straight from the bucket.
  - `/cdn/avatars/{bots,servers}/[id]` — bot/server avatars are Discord's
    own, synced live via dovewing/Infernoplex, not an upload; this mirrors
    a copy into the bucket on first request and re-serves it for 24h
    before quietly re-mirroring, cutting down on repeated live hits to
    Discord's CDN across every card/avatar in the app.
  - A new `/api/uploads` route backs real upload UI in the admin partner
    editor, team settings (avatar + banner), and the bot/server edit
    modals (banner). Every upload re-verifies identity and the specific
    permission needed server-side before writing a single byte — a staff
    `loginToken` checked via `arcadia.hello` for partner logos, or a user
    session token checked via `POST /auth/test` plus Popplio's entity-perms
    lookup for everything else — since the client-side `hasPermString`
    checks that gate the upload buttons were only ever a UI hint, not a
    security boundary.
- The Customize panel is now tabbed (Colors / Fonts / Layout / Content)
  instead of one long stacked list, and grew three new levers:
  - **Colors** — 5 more accent options (cyan, teal, lime, red, pink), 12 total.
  - **Fonts** — added Inter and Space Grotesk alongside the existing four.
  - **Layout** — Compact/Comfortable/Wide page width, applied through a
    `--container-max` CSS var so it works on server-rendered pages too
    (`Container` reads the var instead of a fixed `max-w-7xl`).
  - **Content** — a "Hide NSFW content" toggle that removes `nsfw`-flagged
    bots/servers from every browse/search/profile listing site-wide, via a
    `data-nsfw` attribute on `BotCard`/`ServerCard`/`PackCard` and a plain
    CSS rule (`[data-hide-nsfw="true"] [data-nsfw="true"] { display: none }`)
    — no per-page filtering logic needed. Detail pages are unaffected by
    design (this hides cards from browsing, not a page someone linked
    directly). A "disable cookies" option was requested alongside it but
    skipped: Omniplex doesn't set any analytics/tracking cookies to begin
    with, only the session cookie sign-in itself requires, so there'd be
    nothing for the toggle to actually do. Alongside it, a "Blur NSFW
    thumbnails" toggle (on by default) blurs just the avatar/banner images
    on nsfw-flagged cards via `[data-blur-nsfw="true"] [data-nsfw="true"]
    img { filter: blur(...) }`, leaving the title/description legible. It's
    disabled in the UI (and its applied state forced off) whenever "Hide
    NSFW content" is on, since there's nothing left to blur once nsfw cards
    never render at all.
- Banner images for bots, servers, and teams (`BotCard`/`ServerCard`, plus
  the bot/server/team detail pages). Popplio's live API has no `banner`
  field at all any more — Popplio's own conformance notes confirm the whole
  CDN-upload pipeline it depended on was removed — but a historical
  one-time migration left every existing banner sitting at a fixed CDN path
  keyed by the entity's own ID (`banners/{bots,servers,teams}/{id}.webp`),
  discovered from that migration script since Popplio's API no longer
  advertises it anywhere. New `bannerUrl()` builds that URL; new `Banner`
  component renders it and falls back to a themed gradient (using the
  viewer's own accent color, so it tracks Customize) for anything that 404s
  or never had one uploaded — same idea as the existing partner-avatar CDN
  fallback.
- Webhook management for bots and servers, from a new "Webhooks" dashboard
  dropdown item on each listing: create/edit/delete webhooks (HMAC, simple
  secret, or legacy auth), pick an event whitelist, send test deliveries
  with dynamically-rendered variable inputs per event type, and browse
  paginated delivery logs. Built entirely on existing Popplio webhook
  routes that had no Omniplex UI before now.
- A "Change Team" dashboard action for bots, using Popplio's
  `PATCH /users/{uid}/bots/{bid}/teams`, letting an owner move a bot to any
  other team they have "Add Bots" on. Servers have no equivalent transfer
  endpoint in Popplio, so this is bots-only for now.
- A public `/partners` page — the `GET /list/partners` client and types
  already existed (used on the homepage) but nothing ever linked to a
  dedicated page. Groups partners by partner type, shows their links and
  (if set) a direct link to their bot listing.
- The main header nav gets the same dropdown-grouping treatment as the admin
  one: Bots/Servers/Packs collapse into "Browse", and Blog/Partners/
  Documentation/About — previously footer-only — collapse into "Community",
  reachable from anywhere now instead of just the footer.
- Public and admin Search both pre-fill with real content on load instead of
  a blank page: admin search runs an empty query (which matches everything)
  on mount and on target-type switch; public search browses the full
  bot/server listing (real backend pagination via `/bots|servers/@all`)
  until a query or tag is submitted, at which point it switches to paginated
  search results (client-side, since `/list/search` has no server-side
  pagination).
- Three new staff admin sections, backed by Arcadia panel RPC methods that
  already existed in Popplio but had no Omniplex UI at all:
  - **Blog** (`/admin/blog`) — full list/create/edit/delete for posts on the
    public `/blog` section, using the `UpdateBlog` RPC (`manage_blog`).
    New posts publish immediately; existing ones can be toggled to draft.
  - **Partners** (`/admin/partners`) — full CRUD for featured partners
    (`UpdatePartners`, `manage_partners`), including link validation
    (must be `https://`). Partner *types* aren't manageable from here yet —
    there's no RPC for creating one, only for assigning an existing type
    to a partner.
  - **Disciplinary Types** (`/admin/staff/disciplinary-types`) — full CRUD
    for staff warning/suspension templates (`UpdateStaffDisciplinaryType`,
    `manage_disciplinaries`): self-assignable, additory, needs-approval,
    max expiry, and a permission-limit picker reusing `ArcadiaPermSelector`.

  Two other backend-ready gaps were identified but deferred (larger scope):
  staff application review (`GET/PATCH /staff/apps*`) and the shop/economy
  admin surface (vote-credit tiers, shop items, item benefits, coupons,
  bot whitelist — five separate CRUD areas under `ops_shop.go`).
- A "Test" button on a freshly created token, using Popplio's existing
  `POST /auth/test` to confirm it actually authorizes before dismissing it —
  disabled for now pending a Popplio deploy (see Popplio's changelog for the
  bug that endpoint needed fixed first).
- API token management, backed by Popplio's existing (previously unexposed
  on the frontend) generic `/{target_type}/{target_id}/sessions` endpoints:
  a new "API Tokens" dashboard tab for a user's own personal tokens, and a
  "Tokens" button on bot/server cards (visible to team members with
  `view_sessions`/`manage_sessions`) for tokens scoped to that bot or
  server. Supports creating a token with a name, expiry, and an optional
  restricted permission set (via the same `PermSelector` used for team
  member permissions), and revoking existing ones. A newly created token's
  raw value is shown exactly once, since Popplio never stores or re-serves
  it after creation.
- Votes now go through Popplio's new self-hosted proof-of-work captcha
  (see Popplio's changelog) automatically, when the bot/server hasn't opted
  out via `captcha_opt_out`. `useVote` fetches a challenge, solves it
  client-side with `crypto.subtle` (`lib/captcha/pow.ts`), and submits the
  solution alongside the vote; both vote buttons show "Verifying…" while
  that's in progress. No user-facing setup — it's invisible on a successful
  vote and only costs a brief moment of CPU work.

### Changed

- Homepage, bot/server index/listing/detail pages, and blog list/post pages
  now fetch with `cache: "no-store"` instead of Next's ISR (`revalidate`)
  — blog posts in particular had crept to a 1-hour window, meaning an edit
  or correction could take up to an hour to show up. `list.getStats()` and
  `list.getPartners()` (homepage stats and partner strip) had no cache
  option set at all, which under Next's fetch defaults meant `force-cache`
  — cached indefinitely until the next deploy, not just "stale for a
  while" like everything else. All of it now hits Popplio directly on
  every request instead. Search was already `no-store`; this just brings
  the rest in line with it rather than leaving the CDN/ISR layer doing
  double duty as an ad-hoc data cache on top of what it's actually for
  (serving images). Worth revisiting if Popplio's own load becomes a
  problem at higher traffic, but not a concern at current scale.
- The header's "Create" menu (`NavGroupMenu`) was hardcoded `hidden md:block`,
  so it silently never rendered below the `md` breakpoint — mobile users
  could only reach Add Bot/Server/Pack and Create Team by opening the full
  hamburger drawer. Unhid it; it now works as an actual dropdown from the
  collapsed mobile header too. Browse/Community's `NavGroupMenu` instances
  stay desktop-only since their parent nav row already is, so nothing
  changes for those. Also gave both `NavGroupMenu` and the generic
  `Dropdown` component a `max-w-[calc(100vw-1.5rem)]` safety clamp so their
  panels can't overflow off-screen on narrow viewports.
- Bot detail page dropped the "Prefix" stat — most bots are slash-command
  only now, so it was frequently blank or stale. Both bot and server detail
  pages gained "Page Views" and "Invite Clicks" stats instead, using data
  the API already returned but never displayed. The bot's OpenGraph
  share-image (a separate, independent stat list from the detail page) had
  the same stale "Prefix" stat — swapped for "Page Views" there too, and the
  server OG image gained a third stat ("Page Views") to match.
- Tightened-up spacing pass: the dashboard and team settings tab bars had
  almost no top padding (`pt-1`) and nearly-touching tabs (`gap-1`), and the
  API Tokens list rows used noticeably less padding than every other list
  card in the app. Bumped both to match the spacing used elsewhere.
- Admin panel polish pass: the nav bar had grown to 10 flat links as sections
  were added — related pages now group into "Staff" and "Content" dropdowns
  (new `NavGroupMenu`, also used to rebuild the existing "Create" menu for
  consistency). Every admin list page now shares one header component
  (`AdminPageHeader`) and container width (`max-w-5xl` — several pages were
  still on `max-w-4xl`, causing the page width to visibly jump between
  sections). RPC Logs and Partners showed raw Discord user IDs where every
  other admin page already resolves them to a username/avatar (matching the
  Bot Queue's existing `claimed_by` resolution) — both now do the same.
- Bot/server dashboard cards were getting crowded as more per-item actions
  were added (Stats, Tokens, Delete). View and Edit stay as direct buttons;
  everything else now lives behind a "more actions" dropdown (new
  `components/ui/Dropdown.tsx`).
- Accent-color customization is more visible throughout the site instead of
  being mostly confined to buttons and links: the homepage hero highlights
  "best" in the accent color, the header nav's info badges (Certified,
  Staff, Pending, etc. — previously a hardcoded blue regardless of chosen
  accent) now tint with the selected accent, and the Bot/Server/Pack/Team
  dashboard cards all share one accent-tinted hover treatment (border, title
  color, and arrow icon) instead of Pack and Team cards using a plain zinc
  hover that Bot/Server cards had already moved past. The homepage's
  Partners chips and News & Updates cards were missed in that first pass —
  now match. Dark-mode card borders were also bumped from `zinc-800` to
  `zinc-700`: against the `zinc-950` page background and `zinc-900` card
  fill, the old border was too close in lightness to read as a border at
  rest, so cards looked edgeless until hovered.

### Fixed

- Partner and team avatars (`/cdn/avatars/{partners,teams}/...`) 404'd on
  every request, even for files confirmed to exist in the bucket. Next.js's
  router matched those URLs against the bot/server avatar mirror route
  (`/cdn/avatars/[targetType]/[id]`, 2 segments after `avatars` — same shape
  as `avatars/partners/<file>.webp`) instead of the intended static-asset
  catch-all, and that route 404'd immediately since `"partners"`/`"teams"`
  aren't `"bots"`/`"servers"`, never touching S3 at all. Moved the mirror
  route to `/cdn/avatar-mirror/...` so the two can't collide on URL shape.
- `Team.avatar` was silently blank everywhere it was used (dashboard Teams
  tab, `/teams/[id]`, `TeamPicker`, and the team-owner blocks on bot/server
  detail pages) — the exact same class of bug as the partner-avatar one
  below. Popplio's API dropped `Team.avatar` entirely along with the rest of
  its CDN pipeline, so `resolveAsset(team.avatar)` always resolved to null;
  the frontend type still claimed `AssetMetadata | null` as if the field
  were live. Found while wiring up banner support, which uses the same
  legacy-CDN-path pattern. Replaced every call site with `teamAvatarUrl()`
  and removed the stale `avatar`/`banner` fields (and now-unused
  `AssetMetadata`/`resolveAsset`) from the API types entirely rather than
  leaving them typed as something Popplio no longer sends.
- The Customize panel (accent/font picker) was positioned with a hardcoded
  `fixed inset-0` guess (`pt-16 pr-4`) instead of anchoring to the gear icon
  that opens it, so it visibly floated in the wrong spot whenever the header
  layout shifted. Switched to the same anchored-dropdown pattern already
  used elsewhere (`components/ui/Dropdown.tsx`) — it now opens directly
  under its trigger button.
- The homepage's Partners section resolved each partner's avatar via
  `resolveAsset(partner.avatar)`, but Popplio's public partner response has
  no `avatar` field at all (only ever had it on the type, not the wire) — a
  partner's image is `partner.user.avatar`, already a full resolved URL.
  Every partner avatar on the homepage was silently blank as a result. Fixed
  there and used correctly in the new `/partners` page.
- That fix was itself using the wrong source: `partner.user.avatar` is the
  linked Discord account's avatar, not the partner's actual logo. Popplio's
  CDN-upload pipeline for partners was removed outright (see its
  `CONFORMANCE.md` §D11b), but the old manually-uploaded logos are still
  sitting on the CDN at a fixed, undocumented path keyed by partner ID
  (`avatars/partners/<id>.webp`). All three partner-avatar call sites
  (homepage, `/partners`, and the admin edit modal's new preview) now
  resolve there via `partnerAvatarUrl()`, falling back to a generated
  avatar for any partner without a file at that path.
- Staff Panel sign-in on prod failed with a misleading "Method Not Allowed"
  whenever `NEXT_PUBLIC_ARCADIA_URL` was configured with a trailing slash:
  `postQuery()` always appends its own `/`, so the request landed on a
  double-slash URL, which the panel API 301-redirects to the real path —
  and per the Fetch spec, a `POST` following a `301` is replayed as a `GET`,
  which the panel API correctly (but confusingly) rejects with
  `405 Method Not Allowed`. `ARCADIA_URL` now strips any trailing slash.
- On mobile, the vote button lived in the sidebar, which renders after the
  entire About section and reviews in single-column layout — voting meant
  scrolling past all of it first. Bot/server detail pages now also render a
  compact copy of the Actions card (Add to Server/Join + vote button) right
  after the tags, `lg:hidden`, with the sidebar copy switching to
  `hidden lg:block` so nothing renders twice on desktop.
- Several sign-in prompts away from the dashboard/add flows — bot and
  server vote buttons, the review prompt, and both header sign-in links —
  used a plain `<Link href="/auth/login">` that didn't record where the
  user came from, so signing in from e.g. a bot's page bounced back to the
  homepage instead. New `SignInLink` component wraps `next/link` and sets
  the same `auth_redirect` `localStorage` key `useRequireAuth` already used
  correctly elsewhere, swapped into all five sites.
- Downvoting fired immediately on click, with no confirmation and no way to
  undo it (feedback: a downvote can't be removed or changed once cast).
  Both vote buttons now confirm via a modal first, stating the entity's
  actual cooldown window (4h premium / 12h standard, 6h on double-vote
  weekends — `voteCooldownHours()`) so it's clear voting again isn't
  possible until then either. Popplio has no vote-removal endpoint today,
  so "undo" itself is a backend gap being tracked separately, not something
  this fixes.
- The widget preview card (`WidgetShare`) clipped its image with
  `rounded-lg` (8px) while the widget itself draws its own corners at 16px
  (`WidgetFrame`) — the mismatch let the image's actual corner curve peek
  past the tighter clip, showing a mismatched color ring at each corner.
  Clip radius now matches. Separately, the accent-color swatch row sat
  alongside the theme toggle in one `justify-between` row and overflowed
  the card at typical sidebar widths (12 swatches don't fit next to the
  toggle); it now sits on its own wrapping row underneath.
- Server emoji/sticker galleries were bare icon grids with no name shown
  and no hover feedback, inconsistent with every other card style in the
  app. Both now use the shared card hover treatment (accent border/bg, a
  slight hover scale) and show the emoji/sticker's name as a caption
  instead of only a `title` tooltip, plus a visible count next to each
  section heading.

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
