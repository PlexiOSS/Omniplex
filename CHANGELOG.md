# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.3] - Unreleased

### Added

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
