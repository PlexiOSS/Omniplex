# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Security

- Your login session is now kept in an HttpOnly cookie set by the API,
  instead of in `localStorage` and a cookie page scripts could read. A
  script injected into the site can no longer steal your session. Everyone
  is signed out once when this ships and needs to sign in again.
- The browser now calls the API at `/api/v1` on the site's own host, so the
  session cookie belongs to `omniplex.gg` alone and no other subdomain ever
  receives it. Production needs a reverse-proxy route sending `/api/v1/*`
  to Popplio with the prefix removed. `bun dev` rewrites `/api/v1` to
  `NEXT_PUBLIC_API_URL` itself. `NEXT_PUBLIC_BROWSER_API_URL` overrides the
  path. Server-side rendering still calls `NEXT_PUBLIC_API_URL` directly.
- Signing out now ends the session on the server too, through Popplio's new
  `POST /auth/logout`. Before, it only forgot the session in your browser,
  and the token kept working until it expired.
- Every page sends a strict Content-Security-Policy. Only scripts carrying
  that request's nonce can run, so injected scripts are blocked. Styles,
  images, media and iframes stay open to any source, since listings rely on
  them. Pages are now rendered on each request, because the nonce changes
  every time.
- `NEXT_PUBLIC_SESSION_MODE=header` keeps the old behaviour for setups where
  the site and the API don't share a parent domain, such as running on
  localhost against the production API. Leave it unset in production.

### Fixed

- The "More actions" menu on bot and server cards in the dashboard opens
  in full instead of being cut off by the card.

## [1.11.0] - 2026-10-29

### Added

- An "Official SDKs" knowledge base article for the new JavaScript and
  Python SDKs.

### Changed

- The repo is now a Turborepo monorepo. The website lives in `apps/web`
  as `@omniplex/web`, and its API types moved into the shared
  `@omniplex/api-types` package, which the JS SDK also uses. Run scripts
  such as `bun dev` and `bun run build` from the repo root. The
  `Dockerfile` still builds from the repo root, so deployments don't need
  new settings, and local overrides now go in `apps/web/.env.local`.
- `.dockerignore` matches nested paths, so `apps/web/.env.local` and
  nested `node_modules` or `.next` folders are never copied into the image.
- Cleared the existing Biome errors so linting can run in CI.

## [1.10.0] - 2026-10-29

### Security

- Fixed a stored cross-site scripting issue in the avatar mirror
  (`/cdn/avatar-mirror/...`). Its `src` parameter accepted any file on
  `cdn.discordapp.com`, including uploaded attachments, and served it from
  omniplex.gg with the upstream content type. A crafted SVG or HTML
  attachment could therefore run script on omniplex.gg, and because the
  result was cached under the listing's avatar key, later visitors could
  get it with no `src` at all. `src` must now be that bot's or user's own
  `/avatars/{id}/...` image, that server's own `/icons/{id}/...` image or a
  default avatar, and only PNG, JPEG, GIF, WebP and AVIF responses are
  accepted from Discord. Cached avatars that fail these checks are
  ignored and replaced. Reported by Ran.
- Every `/cdn/` response now sends `X-Content-Type-Options: nosniff` and
  `Content-Security-Policy: default-src 'none'; sandbox`. Anything that
  isn't an image, audio or video type is served as a download.
- A site-wide `Permissions-Policy` blocks the camera, microphone,
  location, screen capture, USB, serial, HID, Bluetooth, MIDI, payment,
  passkey, wake lock, XR and clipboard-read features, for the site and
  every frame it embeds. Iframes in user Markdown could previously ask
  for these with their `allow` attribute, and the prompt named
  omniplex.gg. Fullscreen, autoplay, picture-in-picture and DRM stay
  allowed so video and music embeds keep working, and only omniplex.gg
  itself can write to the clipboard.
- The Open Graph and widget image fetcher only loads HTTPS images from
  Discord's CDN and our own CDN, with a 4 second timeout, no redirects
  and only PNG, JPEG, GIF, WebP and AVIF responses. Avatars only came from
  Discord syncs, so this wasn't reachable, but any future user-set image
  URL would otherwise have let the server fetch arbitrary URLs.
- Uploads are checked against the file's real contents, not just the
  type the browser reports. A PNG, JPEG, GIF, WebP or MP3 upload whose
  bytes are something else is rejected.

### Changed

- Team member avatars on team pages link to each member's profile, and
  the About > Team cards are centred in a wrapping row.
- The header's logo, navigation and actions sit in a centred three-column
  layout.
- The search shortcut hint shows ⌘ K on Apple devices instead of always
  showing Ctrl K.
- Rate limit links point to the new `docs.omniplex.gg/docs/developer/`
  docs path.
- Vote captchas now use Cloudflare Turnstile instead of the in-browser
  proof-of-work puzzle. Bot and server vote buttons show the Turnstile
  check when the listing uses captchas, and the vote buttons appear
  once it passes. Owners can still turn captchas off in the listing's settings,
  and they're on by default. Needs the new
  `NEXT_PUBLIC_TURNSTILE_SITE_KEY` build variable, which is also passed
  through the Dockerfile and the Docker publishing workflow.

### Fixed

- Tables in articles and descriptions no longer squeeze columns down to a
  single character, and inline code in table cells stays on one line.
- The "Sponsor captchas" setting did nothing: vote buttons only checked
  whether the listing had opted out. Voters who turn it on now get the
  captcha on every bot and server.

## [1.9.0] - 2026-10-28

### Added

- Recently bumped: a Bumped tab in the home page's server lists and a
  "Recently bumped" sort when browsing servers, driven by the new `/bump`
  command.
- Server pages show a Bumps card with when the server was last bumped,
  its bumps in the last 30 days and its top bumpers, and mention `/bump`
  and `/vote`.
- A "Bumping and Voting from Discord" knowledge base guide.
- Owner analytics. The Statistics section of the bot and server dashboards
  now has an "Over time" view with daily charts for votes (manual and
  automatic), page views, invite clicks, and servers or members, over 7
  days, 30 days, 90 days or a year, with totals for the range. Hover a
  day for its numbers.

### Fixed

- The "On this page" outline's heading cleanup now removes any `<` or
  `>` left after stripping tags, clearing a CodeQL "incomplete
  multi-character sanitization" alert. The text was never rendered as
  HTML, so this wasn't exploitable.

## [1.8.1] - 2026-10-27

### Added

- A `Publish Docker Image` workflow builds the `Dockerfile` and pushes it
  to `ghcr.io/plexioss/omniplex` on every `v*` tag or when run by hand.
  The `NEXT_PUBLIC_*` build arguments come from the repository's Actions
  variables of the same name, so set those before the first run.

### Fixed

- Security: short-link domains could redirect off-site. A path starting
  with `//` (such as `https://botlist.site//example.com/x`) was resolved
  as a different host. Redirects now always stay on the main site.
- Uploads only accept letters, digits, `-` and `_` in their target and
  asset IDs.
- The add-template form takes a full `discord.new/...` or
  `discord.com/template/...` link as well as a bare code, and rejects
  anything else before sending it.

## [1.8.0] - 2026-10-27

### Added

- A `Dockerfile` for running the site in a container. It builds on
  `node:24.22.1-trixie-slim` (the Node 24 security release from
  2026-10-20), installs dependencies with Bun from `bun.lock`, and runs
  `next start` as the unprivileged `node` user on port 3000. The
  `NEXT_PUBLIC_*` values are build arguments, because Next.js inlines
  them at build time; any left empty fall back to the defaults instead of
  becoming blank. Runtime settings (`S3_*`, `SHORT_LINK_DOMAINS`) are
  passed when the container starts.
- Auto-vote, a $2.99/month subscription that votes for up to 3 bots or
  servers as soon as your cooldown ends:
  - A new Auto-vote tab in the dashboard to subscribe, manage billing,
    and pick listings. Each listing votes whenever possible or on a
    schedule of weekdays and a time window in your own timezone, and
    shows when it last voted or why it was skipped.
  - Bot and server settings have an "Accept automatic votes" option under
    Options, on by default.
  - A new Auto-vote knowledge base guide. Voting Rules and Vote Webhooks
    mention it, including the webhook's new `auto` field.
  - After a manual upvote, bots and servers that accept automatic votes
    show a small "Never miss a vote" link to the Auto-vote tab.
  - Bot and server stats in the dashboard show how many of this month's
    votes were automatic.

- New shop items for bots and servers:
  - Highlighted Card gives the card an accent glow everywhere it's shown.
  - Spotlight puts the listing in the home page Spotlight section.
  - Card Theme lets the owner tint the card with their own colour, set
    from a new Card theme section in the dashboard settings. The same
    colour tints the header (avatar, name and badges) on the bot or
    server's page.
  - The Launch Bundle combines Featured, Priority Boost and Vote Blitz
    for less, and bundles get their own shop icon.
  - The Shop guide lists them.

- Pin one of your bots or servers to the top of your profile from the
  new Pinned listing option in the dashboard's profile editor.

- A `/badges` page lists every badge, grouped into profile, bot and
  server, and team badges. Each shows what it means, how to earn it
  (worked out from its automatic rule, or "Awarded by Omniplex staff"),
  how many holders it has, what it can be shown on and whether it's also
  a Discord linked role. It's linked from the Community menu, the footer,
  profiles and the sitemap.

- An `/alternatives` page, "Omniplex vs other bot lists", for people
  coming from top.gg, Discord Bot List and similar directories. It covers
  what Omniplex does differently and four steps to bring a bot or server
  over, with links to the matching guides. It's in the footer and the
  sitemap.

### Changed

- Support tickets match the rest of the site:
  - The ticket list is one card with open tickets first, a status icon on
    each row and closed tickets dimmed, plus proper loading, empty and
    signed-out states.
  - A ticket opens with a header card showing who opened it and when,
    the message count, and who closed it.
  - Staff replies are tinted and tagged "Staff", so they stand out from
    yours.
  - The reply box is a card with a character count, Send, and Close
    ticket in its footer, and a closed ticket says so in a clear banner.
  - The not-found and sign-in screens use the shared status card.
- The ticket thread was reworked again:
  - Messages sit in one conversation card, with consecutive messages from
    the same person grouped under one name, and day dividers.
  - Bots are tagged "Bot" rather than "Staff", and your own messages are
    marked "You".
  - Empty messages (such as a bot's component-only message) are hidden
    instead of showing "No text content".
  - Discord **bold**, *italic*, __underline__ and ~~strikethrough~~ render
    in messages and embeds.
  - A sidebar in the same style as bot and server pages has Close or
    Reopen, a Ticket card (status, topic, created, last activity, message
    count and a copyable ID) and a People card listing everyone involved
    with what they did and how many messages they sent, linking to their
    profiles.
  - The reply box sits at the bottom of the conversation and sends with
    Ctrl+Enter.
- The search page opens with a Discover section above Explore: popular,
  top voted, certified and new bots or servers, switchable in place, with
  a link to browse them all.

- Profiles use the same layout as bot and server pages:
  - The bio renders as Markdown, in its own About card.
  - A sidebar holds a Stats card (bots, servers, packs, teams, votes this
    month and all time, and join date), a Badges card and a Links card.
  - Each badge in the Badges card is a row with a coloured icon tile, its
    name and its description, instead of a pill with the text squeezed
    beside it, with a link to all badges.
  - Bots and servers on a profile show two per row so cards have room.

- Bot, server, team and profile pages declare a canonical URL, so a
  listing reachable by both its ID and its vanity is indexed once, at the
  vanity address the site and sitemap already link to.

- The header menus are richer:
  - Browse is split into Listings and Assets, Community into What's new,
    Explore and Help, and Create lists each option, all with an icon and
    a one-line description.
  - External links (Documentation, Status) open in a new tab and are
    marked as such.
- The Customize panel was redesigned and has more options:
  - A Theme tab with light, dark and system mode, eight presets
    (Classic, Discord, Terminal, Editorial, Bubblegum, Ocean, Neon and
    Forest) that set the accent, font and corners together, and a larger
    accent grid.
  - Five more accent colours: Blurple, Violet, Fuchsia, Sky and Green.
    They also work in embed widgets.
  - Six more fonts: DM Sans, Manrope, Nunito, Outfit, IBM Plex Sans and
    Atkinson Hyperlegible. Each font option previews itself.
  - The Layout tab shows page widths as small diagrams and adds a Corners
    setting (sharp, default or round) that changes the rounding of cards,
    buttons and inputs across the site.
  - Fonts other than the default are no longer preloaded on every page.
    They load only when chosen or previewed.
  - Light and dark mode are chosen only in the Customize panel. The
    separate sun and moon toggle in the header and mobile menu is gone.
  - A "Reset to defaults" button at the bottom of the panel restores
    every setting, including light, dark or system mode.
- Bot and server cards show more stats: page views and invite clicks on
  both, members online on servers, and shards on bots, alongside votes
  and servers or members. The stats wrap onto a second line when there
  isn't room. A new Card stats section in Customize, under Content,
  picks which ones appear. Invite clicks and shards are off by default.
- The mobile menu scrolls inside its own panel and stops the page behind
  it from scrolling, so long sections like Customize are fully reachable
  on small screens.

- The blog was redesigned:
  - The list leads with the latest post as a large featured card, then
    shows the rest as a two-column grid of cards with tags, a summary,
    author and date.
  - Tag filters along the top narrow the list (`/blog?tag=...`), and the
    tags on a post link to them.
  - A post has a centred header with author, date and reading time, an
    "On this page" outline that follows your scroll on wide screens, and
    "More from the blog" at the end.
- The knowledge base was redesigned:
  - The landing page has a "How can we help?" search banner, category
    cards with an icon and their first few articles, and a "Still stuck?"
    prompt to open a ticket.
  - The sidebar shows each category with an icon and expands only the
    one you're in.
  - Category pages list articles in one card with reading times.
  - Articles show a breadcrumb, reading time, an "On this page" outline,
    previous and next links within the category, and a link to open a
    ticket.
- Blog posts and knowledge base categories and articles declare canonical
  URLs.

- The home page's Top Voted tab only lists bots and servers that have at
  least one vote this month, and stays hidden until at least six bots or
  six servers qualify. Until then the section opens on Most Viewed, so a
  fresh monthly reset no longer shows a wall of "0 votes". Tabs with
  nothing to show for the selected Bots or Servers toggle are hidden.
  The search page's Top voted shelf skips listings without votes too.

- On phones, the home page's tabbed sections show their lists (Most
  Viewed, New, Random, Certified and so on) as a dropdown, with the Bots
  and Servers switch beside it on the same row. Sections without lists,
  like Spotlight, show only the switch in the same place, so every
  section lines up. The tabs no longer show a scrollbar or cut off
  Random. Desktop keeps the tab row.

- The Bot Status & Uptime guide explains the order uptime checks use and
  that checks with no data are skipped rather than counted as offline.

### Removed

- `railpack.json`. The site deploys from the `Dockerfile`, and the README
  has a new Deployment section on building it.

## [1.7.0] - 2026-10-27

### Added

- Twelve knowledge base guides:
  - Bots: Adding a Bot, Getting Your Bot Approved, Writing a Great Bot
    Page.
  - Servers: Getting Your Server Approved, Writing a Great Server Page,
    Your Server Page (member and online counts, boosts, the emoji
    showcase, votes, reviews and sharing).
  - Packs: Creating a Pack, Emoji and Sticker Packs, Sound Packs,
    Managing Your Packs.
  - The Premium article explains using credits for a discount at
    checkout.
  - Managing Listings: Markdown and HTML in Descriptions (what's
    supported and what's stripped) and Styling Your Page (the allowed
    inline CSS properties, with examples for cards, badges, grids and
    embeds).

### Changed

- SEO:
  - The sitemap lists every listed bot, server and pack (paging through
    the API, up to 50 pages each), every knowledge base category and
    article, published blog posts, tag pages and the public section
    pages. It used to include only the first page of bots and servers.
  - Every page has structured data for the site (`WebSite` with a
    search action, which can give Omniplex a search box in Google, and
    `Organization` with the logo and social profiles).
  - Bot pages have `SoftwareApplication` data, with an aggregate rating
    when the bot has reviews, so search results can show stars.
  - The site title is "Omniplex: Discord Bot List and Server List", with
    a new description and keywords. The old description claimed
    "thousands of bots".
- Reviews and replies have a Copy link action. The link opens the page
  with that review highlighted, and staff can paste it into the new
  Delete Review action in the staff panel.

- Premium checkout can use the chosen bot's or server's vote credits for
  a discount. The order summary offers "Use N credits for $X off" when
  the listing has credits, covering up to half the price, and shows the
  original total struck through next to the new one. Unpaid checkouts
  return the credits.
- Server pages show the server's boost level and boost count in the
  sidebar when it has any boosts.

- Emoji, sticker and sound pages put everything in one card: the
  preview on a dotted background, then the name, pack, uploader, stats
  (downloads, type or length, upload date) and actions (Download, Short
  link, View pack). This replaces the sidebar of four small cards.
- Theme pages show the profile preview next to the theme's name, tags
  and author, a gradient strip, large copyable color swatches, and steps
  for applying the theme on Discord.
- Template pages merge the stats and uploader into one Details card,
  which also lists the number of channels and roles.
- Dashboard listing cards (bots, servers, packs, templates, teams and
  themes) have the same footer strip: stats on the left and View,
  Manage and the menu on the right. Team cards have a Settings button.
- Team pages:
  - A profile-style header with the avatar overlapping the banner, the
    vote and Manage buttons, and a stack of member avatars.
  - Stats for team votes, combined votes across the team's listings,
    members, bots and servers.
  - Members link to their profiles, and each section heading shows a
    count.
- On bot and server pages, a team without its own avatar shows the
  listing's avatar instead of initials.
- Bot and server sidebars:
  - Uptime has a colored meter.
  - Online members are shown as a share of all members.
  - Page views are hidden when there are none.
  - A bot's libraries show as separate chips.
  - Links show their domain under the name, with a larger icon.
- On phones, a bar with Vote and Add (or Join) slides up from the bottom
  of bot and server pages once the main buttons scroll out of view.
- Reviews on bot, server, team and template pages:
  - A summary card replaces the "Reviews" heading: the average rating,
    a 5 to 1 star breakdown and a "Write a review" or "Edit your review"
    button (or "Sign in to review").
  - With more than one review, they can be sorted by newest, highest or
    lowest.
  - Each review is a card with its replies inside it. Owner responses
    are tinted and tagged "Owner", your own reviews are tagged "You",
    and Reply shows how many replies there are.
  - Replies no longer show a star rating or ask for one.
  - Deleting asks for a second click to confirm.

- The widget moved out of the bot, server and pack sidebars into an
  Embed button in the action row. It opens a wide dialog with a large
  preview on a background that matches the chosen theme, Markdown, HTML
  and image URL tabs with the full code and a Copy button, and theme,
  accent and stat options beside it. The sidebar is shorter, so short
  tabs no longer leave a large gap.
- The Voters tab is a ranked list with the top three highlighted and a
  bar compared with the top voter, and the all-time total only shows
  when it differs from this month's.
- Bot changelog updates are cards with the title, version and date in a
  header and the notes below. Long updates collapse with a "Show full
  update" button.
- Bot commands are listed in one card per category, with the command
  name highlighted, its usage underneath and the description beside it.
- Cards across the site share one style: rounded corners, padding and a
  solid background in both themes. Some cards were see-through with no
  background, and corner sizes varied from page to page.
- Notifications are one list instead of a stack of boxes. Each one has an
  icon for its kind, unread ones are tinted with a dot by the title, the
  time sits on the right, and the open, read and delete buttons appear on
  hover (always on touch screens). Grouped vote reminders open inline,
  the footer says "Showing 20 of 60" instead of a total that didn't match
  the filters, and preferences are toggle cards.
- Search has a centred search box with a clear button and example
  searches, a "Filter by tag" row linking to All tags, an Explore grid
  with icons (bots, servers, packs, collections, commands, tags), pill
  tabs for result types, and proper empty and error states.
- The Team page shows each person as a profile card with their avatar,
  name and other roles, instead of repeating the group's role as a badge.
- Listing, directory and info pages use the shared page header. Partners,
  Apply, Leaderboard, Legal, Tickets, Team, Moderation, Premium, Shop and
  Linked Roles keep a centred header. Their empty and failed-to-load
  states use the shared empty state.
- Payment success and cancelled, the banned page and the linked roles
  callback use one shared status card.
- Dashboard and settings sections show the section's icon in the header.
  Settings cards match the form cards, checkbox options are bordered
  cards, and the profile editor is split into Profile and Discord profile
  cards with Save in the card footer. The bot Commands and Changelog
  sections no longer repeat the page title.
- The Short link, Vote reminder, Compare and Report actions on bot,
  server, pack and team pages are now matching small buttons in one row
  that wraps cleanly on phones, instead of mixed text links in different
  sizes. Report sits last, and the labels are shorter ("Report", "Vote
  reminder" / "Reminder on").

### Fixed

- Create a Pack requires 1 to 5 tags and a short description of at least
  10 characters before submitting, matching what Popplio accepts.
  Previously a pack without tags failed only after you pressed Create.
- The Create a Pack URL field now matches what Popplio accepts: it drops
  anything but letters, numbers and dashes as you type, stops at 20
  characters and says so in its hint. It used to suggest dashes, which
  the server then rejected after items had already been uploaded.
- Uploading emojis, stickers and sounds failed with "Storage is
  temporarily unavailable". The S3 endpoint is the Cloudflare-proxied
  `cdn.omniplex.gg`, and Cloudflare changes signed HEAD and ranged or
  conditional GET requests on file URLs, so storage rejected them with
  SignatureDoesNotMatch, sometimes intermittently. The check for whether
  an upload's key already exists, and the CDN health check, now use
  bucket list requests, which Cloudflare passes through untouched.
- The API sessions panel only loaded the token list once, so it didn't
  reload after switching to another bot, server or team, and it could
  miss the permission list when your permissions loaded late.
- The bot page's Changelog and Commands tabs showed owner-only text
  ("Updates shown on your bot's page and in the Feed") to every visitor.
  It now only shows to people who can edit the bot.
- Connecting linked roles could fail with "This link has expired or
  didn't come from Omniplex" when Discord finished the sign-in in a
  different tab or browser than the one that started it, which is common
  when starting from the Discord mobile app. The check now uses a
  short-lived cookie as well as the tab's storage, and only rejects a
  sign-in when a different one was started in the same browser.

## [1.6.0] - 2026-10-25

### Added

- Five new day themes in the brand kit (`public/brand/themes/`): St.
  Patrick's Day, Earth Day, Canada Day, Truth and Reconciliation (Orange
  Shirt Day) and Remembrance. Each has the same server icon, animated
  icon, emoji and banners as the seasonal themes. Truth and
  Reconciliation and Remembrance are deliberately calm, with no falling
  particles. The brand README's calendar lists when to use each one.
- A Platform Stats page at `/about/stats`: listed bots, listed servers,
  votes, users and packs, bots and servers broken down by status
  (approved, certified, in review, denied), and the most used tags.
- "How it looks in Discord" previews on emoji and sticker pages, showing
  the asset in a message in Discord's dark and light themes.
- A "Join the Omniplex Discord server" card on the Add a Bot and Add a
  Server forms (optional, with the benefits), which turns into "You're in
  the Omniplex Discord server" once you've joined and has an "I've
  joined, check again" button. Certification, Server Certification and
  Partner applications show the required version and can't be submitted
  until you've joined, and the Apply page marks those programs as for
  server members.
- Queue cards show whether an owner is in the Omniplex Discord server.
- A staff panel sidebar replacing the admin links in the header: the
  signed-in staff member and their top position, a "Jump to" filter, the
  pages grouped into General, Moderation, Staff, Content and Shop (each
  group collapsible), live counts for the queue, open reports, open
  tickets and pending applications (refreshed every minute), Back to
  Omniplex and Sign out, and a collapse-to-icons mode. Collapsed groups
  and the icon mode are remembered. On phones it's a section picker at the
  top of the page.
- The staff panel Overview shows what needs attention (bot and server
  queues with unclaimed counts and the oldest wait, open reports, open
  tickets, pending applications, each linking to its page) and the latest
  staff actions, above the existing platform totals.
- Queue entries show how long they've been waiting ("Waiting 9 days",
  amber after a week and red after two) and how long ago they were
  claimed.
- The staff position editor can set a position's roles in the main,
  testing and staff servers, and keeps any other corresponding roles it
  doesn't recognise.
- Redesigned staff sign-in and two-factor screens: an Arcadia-branded
  panel, a Discord → Two-factor → Done progress indicator, a six-box code
  entry that accepts a pasted code and submits on its own, the setup QR
  code on a white tile so it scans in dark mode, and the manual key in
  groups of four with a copy button.
- An All Tags page (`/tags`) listing every tag in use with how many bots
  and servers have it: the eight most used as cards, then the rest as
  chips, with a filter box, Bots/Servers tabs and Most used or A–Z
  sorting. It's linked from the homepage tags ("All tags"), the Browse
  menu and the footer, and is in the sitemap.

### Changed

- The About page was rebuilt: live numbers linking to Platform Stats, the
  Infinity Bot List story, what you can do on Omniplex (including badges,
  linked roles and the developer API), the three Omniplex bots, and links
  to stats, moderation, the team, status, docs and the changelog. It no
  longer claims "thousands" of bots or describes packs as bots only.
- Every submit form now shares one layout: a page header, numbered
  section cards, and a sticky side column with a live preview or
  guidance, the error message and the submit button. This covers Add a
  Bot, Add a Server, Create a Pack, Create a Team, Submit a Theme, Submit
  a Server Template, Open a Ticket and the staff/partner application
  forms.
  - Add a Bot and Add a Server show a step indicator (find, confirm,
    details), and the first two steps have "Before you start" and "What
    happens next" panels instead of empty space. Prefix and library sit
    side by side, and the preview shows your short description and tags
    as you type.
  - Create a Pack has icon type cards, a URL field that shows the full
    link, a per-type description placeholder, a clearer list of added
    bots or servers, and a live preview.
  - Submit a Theme previews the theme on your own profile card as you
    pick colors.
  - Application forms put each question in its own numbered card, with
    the role's details and an answered-questions progress bar beside
    them.
  - The NSFW checkbox is now a labelled card on every form.
- The sidebar cards on emoji, sticker, sound, template and theme pages
  now have a solid card background.
- The homepage hero no longer shows the stats grid.
- The rotating word in the homepage heading ("bots", "servers", "packs")
  resizes to each word instead of reserving room for the longest one, so
  "Discord bots" and "Discord packs" no longer have a gap in the middle.
- Public pages share a page header (an icon tile, title, description and
  actions) and shared loading, error and empty states: Emojis, Stickers,
  Sounds, Server Templates, Themes, Blog and Collections use them, so
  loading is a centred spinner, a failed load can be retried instead of
  only saying it failed, and Legal gets the same icon header as Tickets.
- The 404 page links to browsing bots and servers, search and the
  knowledge base instead of only "Go home", and the error page offers
  Try again and Go home and asks people to open a ticket with the error
  code if it keeps happening.
- The changelog, blog, badge, coupon and staff position editors are full
  pages (`/admin/<section>/new` and `/admin/<section>/<id>`) instead of
  pop-ups, with a back link, the section header and taller text boxes.
  The list pages link to them, so an edit can be bookmarked or opened in a
  new tab.
- Staff Members has a search (name, ID or position) and No MFA, Frozen
  and Unaccounted filters with counts, sorts by rank, marks you with a
  "You" tag, highlights each member's top position and shows a lock
  instead of the edit button for people ranked above you.
- Staff Positions can be reordered by dragging a row (the arrows stay for
  keyboard use). A drag that would pass a position at or above your rank
  is refused before anything changes.
- RPC Logs is an expandable list: each row says who ran what, on which
  target and why; opening it shows every field with readable labels and
  the raw data. It has a search (staff, action or target ID) and
  Succeeded, Failed and Pending filters.
- Design overhaul of the staff panel's shared parts, so every section
  picks it up: pages are wider with consistent padding; page headers show
  the section (such as "Staff") with the page's icon; the Badges, Blog,
  Changelog, Partners, Reports, Search, Shop, Disciplinary Types, Members,
  Positions, Templates and Tickets lists are one joined card with dividers
  and row hover instead of a stack of separate boxes; empty states have an
  icon; and Queue, Applications and stat cards sit on a raised surface.
- The sign-in page and Discord callback share a new split layout: what an
  account gets you on an Omniplex-branded panel, and the sign-in on the
  other side. It explains what Omniplex asks Discord for (basic profile
  and server list, never passwords, email or messages), links the Terms
  and Privacy Policy, and gives errors an icon and clearer wording,
  including a "Your account is banned" heading before the appeal button.
- Staff panel pages share one loading state and one error state, and the
  error state has a "Try again" button instead of only a message.
- The admin Applications page takes position names from the live
  `/apps/meta` list instead of a hardcoded copy.
- The site footer is hidden in the staff panel.
- Linked roles run through Infernoplex: the Linked Roles knowledge base
  article and page tell server owners to add Infernoplex and pick it as
  the requirement, and members pick Infernoplex when connecting from
  Discord.

### Fixed

- The Platform Status link on the About page went to a page that
  doesn't exist. It now goes to status.omniplex.gg.
- The payment success page said premium was applied "to your bot" even
  when a server was upgraded.
- More copy left behind by the em-dash cleanup: "ranked automatically by
  votes nothing here is hand-ordered" on Collections, and `--` on Server
  Templates, Submit a Template, the pack upload form and the vote credits
  panel.
- Saving a coupon in the staff panel cleared its allowed users, so a
  coupon meant for specific people became usable by anyone after any
  edit. The editor now has an Allowed users field and keeps the existing
  requirements.
- The coupon editor labelled reuse wait and expiry in seconds, but
  Popplio reads them as hours, and it required all three limits even
  though each is optional. They're now in hours and can be left empty
  for no limit. The price field is labelled as the item price with the
  coupon (in credits) rather than a dollar discount, and the coupon list
  says "Items for 0.50 credits", "Items free" and "unlimited uses"
  instead of "0.50 off" and "? uses".
- Staff panel copy: the Search description ran two sentences together,
  the Coupons description used `--`, and the Positions description said
  positions "at or below your own lowest index" when it meant at or
  above your rank.

## [1.5.0] - 2026-10-25

### Added

- Badge rules and linked roles in the admin badge editor: an "Award
  automatically" picker (grouped by Listing, Voting, Ownership and Discord,
  with the number or role ID each rule needs) and a "Use for Discord
  linked roles" toggle that shows how many of Discord's 5 slots are used.
  The badge list shows each badge's rule and linked-role status, and a
  rule type the panel doesn't recognise is shown and kept rather than
  dropped.
- `/linked-roles`, where members connect their Discord account so servers
  can give them roles for their badges, its `/linked-roles/callback`
  page, and a Linked Roles knowledge base article covering both connecting
  and setting up a linked role in a server.

- A brand kit in `public/brand` (guide in `public/brand/README.md`): logo
  marks, the Geist wordmark and app icon as SVG and PNG; favicons and app
  icons; banners for X, GitHub, link previews, Discord, LinkedIn and
  YouTube with a backdrop of real bots from the list; 21 static and 7
  animated Discord emojis; 8 static and 5 animated stickers; and regular
  plus nine seasonal themes (Halloween, Autumn, Winter, Holiday, New Year,
  Valentine's, Spring, Pride, Summer), each with a static and animated
  server icon, an app icon, a logo emoji, a Discord banner and an X
  header.
- Sub-brands for the three Omniplex bots in `public/brand/bots`: Popplio
  (indigo, chat badge), Infernoplex (ember, flame badge) and Arcadia (teal,
  shield badge), each with a static and animated avatar, an app icon, a
  logo emoji, a name lockup, and Discord profile, README and social
  preview banners.

## [1.4.0] - 2026-10-25

**The Dashboard Update.** Settings pages for bots, servers and teams, a
rebuilt dashboard, instant search everywhere, and a refresh of nearly
every public page.

### Fixed

- Premium plan cards read "1 month of premium (1 months)", and the page
  promised "priority placement", which premium doesn't give.

- The dashboard listed a bot or server twice when you could reach it both
  directly and through a team, or through two teams, which also inflated
  the Bots count (31 instead of 16) and duplicated entries on Overview.
- Dashboard bot, server and pack cards said "1 votes", and their footers
  overflowed in narrower layouts.

- The header overflowed on phones once the search button was added. Below
  the desktop breakpoint it now shows only search, notifications and the
  menu button (moved to the far right), and Create, Customize and the theme
  toggle live in the mobile menu. Customize expands inline inside the menu
  instead of opening a floating panel over the page.

- The search page said "Browsing everything search or pick a tag…" (another
  stripped em dash).

- About 80 sentences across the knowledge base (and two in the dashboard's
  Security tab) had their em dashes stripped without rewording, leaving
  run-on sentences such as "regardless of direction you can't use a
  downvote". They're rewritten.
- Getting Started listed the wrong submission requirements: short
  descriptions are 30 to 150 characters (not "up to 191"), and a long
  description of at least 500 characters, a prefix, a library and 1 to 5
  tags are required. It now also covers sticker and sound packs.
- Voting Rules didn't mention the monthly vote reset, the leaderboard, or
  that downvotes need confirming; the Shop article now warns that votes
  must be redeemed for credits before the reset.
- Moderation Transparency said the report link is near the bottom of a
  listing; it's near the top, and teams can be reported too.

- The changelog page showed an empty list for unexpected API errors
  instead of the error page, and its empty state read "No changelog
  entries yet check back shortly" after the em-dash cleanup.

- The About page's "Listed Bots" count left out certified bots.
- Tag pages and `/packs` showed an empty state ("Nothing tagged",
  "No packs available yet") for unexpected API errors instead of the
  error page.

- Commands showed their name twice (`ping /ping`) when the usage was just
  the command name. Usage is now only shown when it adds something.
- Reviews asked signed-out visitors to sign in twice when there were no
  reviews yet.
- Hard-wrapped bot changelog entries rendered every line break, so text
  wrapped at about two thirds of the card's width. Changelogs (on bot
  pages and in `/feed`) now join wrapped lines into paragraphs.
- The Voters tab listed everyone who had ever voted, with no counts, so it
  never added up to the vote total shown in Stats.

- Highlights repeated the bots already shown in Top Voted. It now leaves
  out anything in the first Top Voted page.
- Spotlight showed a tab bar with a single tab, and an uneven last row
  left gaps in the grid. The lone tab is hidden and the last row is
  centred.
- Cards said "1 votes", "1 bots" and "1 servers". Vote, server, member
  and bot counts now use the singular for one.
- The homepage fetched list stats on every load without showing them,
  and the unused `StatsBar` component is removed.

- The voter leaderboard showed "No votes cast yet." when the API was down
  or failed. It now shows the service-unavailable state, and other errors
  reach the error page.
- The leaderboard description read "all-time every upvote ever cast",
  left over from the em-dash cleanup.

- Command names were shown with a doubled slash (`//help`) because stored
  names already include it.

- Owners and staff previewing a pending bot or server now see its
  commands, changelog, reviews and voters. The page forwards the session
  only for unlisted entries, so public listings keep their cached,
  token-free requests.

- Detail pages (bots, servers, teams, users, packs, emojis, stickers,
  sounds, templates, themes, blog posts) turned every API error into
  "Not found", which is how the logged-in-user auth bug hid behind "Bot
  not found". Only a real 404 now shows the not-found page. Outages still
  show "service unavailable", and any other error reaches the error page
  with its digest and a "Try again" button. A failing vanity lookup is no
  longer treated as "doesn't exist" either.
- Logged-in users saw "Bot not found" (and the same for servers, teams and
  profiles) on perfectly normal listings. Server-rendered requests that
  forward the session token now send `Origin: NEXT_PUBLIC_BASE_URL`, which
  Popplio requires before it accepts a user session. The same bug had been
  silently rejecting the upload route's asset-version writes for every
  regular user, so uploaded banners and team avatars never got a version;
  they do now.
- Saving bot or server settings (including changing a vanity URL) failed
  with "contains markup that isn't allowed" whenever the long description
  held a normal Discord invite link, because `permissions=` looked like an
  HTML event handler. The check now only flags `on*=` attributes inside
  HTML tags. Matches the Popplio validator fix.
- The same check also flagged ordinary text like "a regular expression
  (regex)" as a CSS `expression()` attack. It now only looks inside a
  `style` attribute or a `<style>` block.

### Security

- Next.js 16.2.12 → 16.4.3, fixing several critical remote code execution
  advisories this site was exposed to (in `next/og` `ImageResponse`, used
  by the OG images and widgets, and in the image optimizer with AVIF/SVG
  input) plus an image-optimizer SSRF and cache-poisoning issues.
- The built-in image optimizer (`/_next/image`) is disabled
  (`images.unoptimized: true`). Every image on the site was already
  rendered unoptimized, so this changes nothing visible, but it removes an
  endpoint that would fetch and process attacker-supplied images.
- `overrides` pin patched versions of `postcss`, `nanoid`,
  `source-map-js`, `js-yaml` and `baseline-browser-mapping`, which came in
  through Next.js, Tailwind and gray-matter. `bun audit` reports no
  vulnerabilities.

### Added

- Bot, server and team pages show their custom badges (such as Partner,
  Veteran and Staff Pick) next to the built-in ones. Only user profiles
  showed them before.

- The admin changelog and blog editors have a "Ping notified roles when
  published" checkbox on entries that haven't been announced yet. It turns
  on once Published is ticked (or Draft is unticked for blog posts), and
  defaults to on for Omniplex changelogs and blog posts and off for other
  projects.
- The blog editor said new posts publish immediately, but they're saved as
  drafts. It now says to untick Draft to publish.

- Bots, servers and teams have their own settings pages with a sidebar,
  replacing the edit, stats, tokens, webhooks and change-team pop-ups.
  Bots (`/dashboard/bots/{id}`): details, appearance, commands, changelog,
  statistics, API sessions, webhooks, team and a danger zone. Servers
  (`/dashboard/servers/{id}`): details including visibility, appearance,
  statistics, API sessions, webhooks, team and a danger zone. Teams
  (`/teams/{id}/settings`): overview with the team's listings, profile,
  members (permissions now edit inline), webhooks, vote credits and a
  danger zone. The section is kept in the URL, so links like
  `?section=webhooks` go straight there. Dashboard cards link to these
  pages through Manage and the actions menu.
- Servers can be deleted from their settings page by anyone with the
  Delete Servers team permission. Deleting a bot, server or team now asks
  you to type its name to confirm.

- Short-link domains. Set `SHORT_LINK_DOMAINS` (comma-separated, read at
  runtime) and any request to `<domain>/<id or vanity>` redirects to that
  bot, server, team, pack, emoji, sticker or sound on the main site, unknown
  codes go to search, and longer paths redirect to the same path on the main
  site. Adding a domain is a config change and a restart. Bot, server, team
  and pack pages get a "Short link" button that copies the link on the first
  configured domain (hidden when none is set). Implemented as a Next.js
  proxy (`src/proxy.ts`).

- Instant search: press Ctrl/Cmd+K or `/` anywhere (or click the search
  icon in the header) to search as you type. It shows the top bots and
  servers, matching tags, and a link to all results, searches only bots or
  only servers when you're on those browse pages, and works from the
  keyboard. On phones it has a close button instead of the keyboard hints.

- Owners, and team members with permission to manage owner reviews, can
  reply to a review as an **owner response** from the Reviews tab.

- Knowledge base: new **Managing Listings** and **Developers** categories
  and 14 new articles: Finding Bots & Servers, Reviews, Reporting &
  Appeals, Your Data, Documenting Commands, Posting Changelog Updates,
  Teams, Vanity URLs, Avatars & Banners, Listing a Server, Posting Stats,
  Bot Status & Uptime, Vote Webhooks, API Tokens and Embeddable Widgets.
  Each was checked against the current Popplio code.
- Headings in knowledge base articles have anchor ids, so `#section` links
  work (including the existing link to Permissions Reference's Guild
  Moderation section).

- `/bots` and `/servers` are rebuilt as server-rendered browse pages:
  sort by newest, top voted, trending, or most servers/members; filter by
  tag chips and "Certified only"; a result count; and filters and page
  kept in the URL.
- User profiles show the user's voter leaderboard rank and votes (this
  month and all time) as one line under their links, and a new Activity
  tab with the bots and servers they vote for most and their recent
  reviews, each linking to the review on its page.
- Tag pages show the real number of bots and servers with the tag (they
  were capped at 12), "See all" links into the filtered browse pages, and
  related tags.
- `/packs` has Top and Newest sorting, pagination (it only ever showed the
  first 12 packs), a result count, and a "Show all packs" toggle.

- Bot pages show uptime (from Popplio's presence checks) in Stats and the
  bot's status as text next to its name. Links get icons (GitHub, Discord,
  X, docs, support, privacy, terms, or a globe). The Voters tab has a
  count, and voters are listed with their votes since the last reset and
  their all-time total. The commands list is a compact two-column grid
  with a filter box (for bots with more than 8 commands) and a link to the
  bot in the Command Directory. Changelog entries show their date as well
  as how long ago they were posted.

- Homepage refresh. The hero shows live counts of listed bots, servers,
  votes and packs, plus one-click popular tags. A new "Happening on
  Omniplex" section shows recently updated bots (linking into `/feed`),
  the top voters this month and a Command Directory preview. Collection
  cards show their top three bots' avatars. The Bots/Servers toggle is
  remembered and applies to every section at once.

- Voter leaderboard redesign: "This month" (the default, since the last
  monthly vote reset) and "All time" tabs, the top three as highlighted
  cards, up to 50 voters, links to each voter's profile, a per-type
  breakdown of their votes, the listed bot or server they vote for most,
  and a "You're #N of M voters" card for signed-in users.

- Bot changelogs (on the bot page and in `/feed`) now render Markdown and
  HTML, so headings like `### Added`, lists, code and links display
  properly instead of as raw text. They go through the same sanitizer as
  bot descriptions. The "Post update" form says Markdown and HTML are
  supported and shows a Markdown example.

- Partners that are bots listed on Omniplex now show the bot's avatar as
  their logo on `/partners` and the homepage marquee, so it always matches
  the bot. Other partners keep their uploaded logo. Link a partner to its
  bot with the Bot ID field in the admin partner editor.

### Changed

- The Premium and Shop pages are rebuilt around a sticky side panel.
  Premium lists what it actually includes (a 4-hour vote cooldown, the
  Premium badge and the homepage Premium row), shows each plan's length
  and price per month with a "Best value" tag, and has a checkout summary.
  Bots that can't be upgraded show why ("Already premium", "In review")
  instead of being hidden. Shop has a wallet panel with the balance, vote
  conversion, coupons and conversion rates, shows how many more credits an
  item needs, and splits purchase and vote history into tabs. Bundle
  items such as Premium (Bronze) get a full-width card listing their
  benefits, so single-benefit cards stay compact. Both pages
  use a searchable picker instead of listing every bot down the page,
  preselect your first listing, and include servers from all your teams
  once each.
- Bot and server API tokens are labelled "API sessions" in their settings
  sidebar and the dashboard card menus.

- Dashboard overhaul. A sidebar (grouped into Account, Listings and
  Activity, with counts, and a section picker on mobile) replaces the
  horizontally scrolling tab strip, and the current section is in the URL.
  Overview now shows what needs attention (denied listings with a
  re-review link, listings in review, a reminder to redeem this month's
  votes before the reset, unread notifications), this month's numbers (votes
  on your listings, live listings, your voter rank, votes you cast, your
  most-voted listings) and quick actions. Bots and Servers have search,
  sorting, status filters (live, in review, denied) and, for bots, a
  yours/through-teams filter with an honest combined count. Teams show
  member, bot and server counts, your role, and links to the team and its
  settings. Notifications load more as you scroll instead of paging, can be
  filtered by category or unread, group runs of vote reminders into one row,
  have "Mark all read", and keep preferences behind a button. Profile shows a
  live preview beside the form. "API Tokens" is renamed **Sessions**
  (`?tab=sessions`; old `?tab=tokens` links still work) and lists API tokens
  and signed-in devices separately, with "Revoke" and "Sign out".
- The Apply page groups positions into Join the team, Programs and For bot
  owners, now includes Bot Resubmission (it was hidden), shows whether each
  is open, links each to its requirements, and links to your applications.
- The footer's Discover column adds Trending Bots and Certified Bots.

- The search page is rebuilt. The query, tags, result type and page are all
  in the URL, results update as you type, there's an "All" view with each
  type's top results and "See all N", per-type tabs with real counts and
  paging, and the empty page links to browsing, collections and the Command
  Directory instead of repeating the full bot list. The unused `useSearch`
  hook is removed.
- The Partners page lists bot partners first, links each bot partner to its
  page on Omniplex, shows who runs each partner, drops the repeated type
  badge, says so if partners fail to load, and ends with a "Want to partner
  with us?" section linking to the requirements and application.

- The Moderation Transparency page is redesigned: a summary row (reports
  filed, share closed, bot approval rate, listings awaiting review),
  side-by-side cards with proportional bars for the bot and server review
  pipelines and for reports by reason and status, an enforcement card, and a
  short "How moderation works" section linking to the rules, the reporting
  guide and the team. Sections that fail to load say so instead of
  disappearing, and the "…right now check back shortly" sentence is fixed.

- Add a Server requires the tracking bot to be in the server (with an
  "I've invited the bot, check again" button), since Popplio now checks that
  you own or manage the server before listing it.
- Pack Rules match how packs actually work: bot and server packs can include
  anyone's listings, and the rules now cover emoji, sticker and sound packs.

- The changelog page keeps the latest release of each project open and
  collapses older ones to their summary and a count of changes ("4 added ·
  6 fixed"), with "Show changes" to expand. Release text is capped at a
  readable width, a sticky sidebar lists every version by project, each
  release has a link anchor (`#popplio-1.9.1`, which opens it), the project
  filter is kept in the URL (`/changelog?project=popplio`), and releases
  show their date as well as how long ago they shipped.

- The Team page groups staff by their most senior position (Executive,
  Management and so on, with a count), shows each person's top position
  as their title, their other roles as one line ("Also: … +N"), and their
  `@username` so accounts with the same display name can be told apart.
  Each card links to the person's profile.

- Server pages get the bot-page changes: the embed widget behind "Get
  embed code" for visitors, a short header strip when there's no banner,
  link icons, and a Voters tab count.

- The embed widget on bot pages is behind a "Get embed code" button. A bot
  with no banner gets a short header strip instead of a full-height empty
  one.
- Signed-out vote buttons on bot, server, team and pack pages show the
  vote count ("Sign in to vote · 8").

- The Command Directory is useful before you type: it shows the bots that
  have documented commands (with a preview of each one's commands) and
  example searches taken from real command names. Search now matches
  descriptions as well as names, results are grouped by bot with a copy
  button for each command's usage, and a sidebar (same layout as `/feed`)
  holds search, tag filters and a bot filter. Filters live in the URL. A
  short call to action points bot owners at the API for documenting
  commands.
- Rewrote user-facing copy that used em dashes (about 60 strings across
  the site and the 11 in the knowledge base) to use periods, colons or
  commas instead. Title and label separators such as the page-title
  suffix were left unchanged.

- The `/feed` page is easier to navigate as it grows:
  - Long updates collapse after a few lines with a "Show more" toggle.
  - Updates are grouped under Today, Yesterday, This week, This month,
    then by month.
  - A search box, tag chips and a "More from this bot" button filter the
    feed; filters live in the URL so filtered views can be shared.
  - On wide screens a sticky sidebar holds the filters and a "Recently
    updated" list of bots; on mobile the filters sit above the feed.
  - Changing page scrolls back to the top.

## [1.3.0] - 2026-09-26

### Added

- Notifications open the page they are about. Clicking one in the bell
  menu marks it read and navigates to its link, such as the bot that was
  approved or denied. The dashboard's Notifications tab has an open button
  on each notification with a link, and shows long messages such as denial
  reasons in full.
- The add bot form and the bot edit modal check the invite link as you
  type. An invite that requests Administrator shows an error, with links to
  its noadmin.info report and permission calculator, and the form will not
  submit. Popplio enforces the same rule on the server. Other discord.com
  invites show their permission count, and a warning when the noadmin.info
  API rates them broad or excessive. Custom (non-Discord) invite links get a
  note that staff will check them during review.
- The admin bot queue marks bots whose invite requests Administrator with a
  "Requests Administrator" badge, and links each discord.com invite to its
  noadmin.info permission report.
- The Bot Rules article says admin invites are rejected automatically and
  links to noadmin.info.
- Bot pages now show whether a bot's invite requests Administrator, right
  under "Add to Server". The permissions are read from the bot's existing
  invite URL, so no API change was needed. Bots that don't request it show
  a quiet "Doesn't request Administrator" line with the permission count.
  Bots that do get a warning explaining it can be unticked on Discord's
  invite screen. Both link to the full report on noadmin.info. Invites
  without a `permissions` value show nothing.
- Changelog entries can have a Security section. It shows on the changelog
  page and in the RSS feed, can be edited in the admin changelog editor
  (including drafts from the generator), and is counted in the admin list.
  The field is optional in the frontend types, so pages keep working
  against a Popplio that hasn't run the migration yet.

### Fixed

- Ticket messages now render the way they looked in Discord. Custom emoji
  show as images, `<@user>` mentions show the person's name when they took
  part in the ticket, and role, channel and slash-command mentions, `<t:…>`
  timestamps, links and inline code are formatted instead of shown as raw
  markup. Bot messages that were only an embed used to appear as an empty
  card because the frontend dropped `embeds` and `attachments` from Popplio's
  response. Embeds now render with their colour, author, title, fields, image
  and footer, and attachments are listed by name and size. A message with
  none of these says "No text content".
- Role and channel mentions in tickets now show the real role name (in the
  role's colour) and channel name, and mentions of people who never posted in
  the ticket show their name too, using the new `mentions` field on
  `GET /tickets/{id}`. Anything Popplio can't resolve still falls back to
  `@role`, `#channel` or `@unknown-user`.
- Ticket attachments are marked "Archived". They came from the old Discord
  ticket system and the files aren't stored on Omniplex, so they can't be
  opened; hovering explains why instead of the card looking broken.
- The remove buttons in the emoji, sticker and sound pack builders only
  appeared on hover, so on phones there was no way to remove an item. They now
  stay visible on touch screens and show on keyboard focus.
- Six horizontally scrolling areas (the moderation transparency tables, admin
  logs and shop purchases, team settings tabs, and the session token field)
  could also scroll vertically; they now scroll sideways only.
- Server template and team cards could be stretched wider than their grid
  column by long content.
- Legacy tickets stored their messages newest-first, so the conversation read
  bottom to top. Messages are now always shown oldest-first.
- Ticket ownership was taken from the first message's author instead of the
  ticket's author. On legacy tickets that first message is often the bot, so
  the ticket's real owner was offered a "Reopen ticket" button that could
  only fail.
- Long unbroken text (tokens, IDs, URLs) no longer runs out of its card. This
  covered ticket messages and titles, reviews, bot changelogs, the feed,
  admin reports, applications, queue and search results, and the names in
  bot, server, pack, template, team, user, emoji, sticker and tag page
  headings.
- Pending and denied bot and server pages are no longer public. Owners,
  team members and staff still see them, with a notice explaining the
  listing is hidden and can't receive votes, reviews or shop perks yet.
  To make that work on server-rendered pages, signing in now also stores
  the session token in a first-party `omniplex_session` cookie (existing
  sessions get it automatically on the next visit). Bot, server, team and
  user pages forward it to Popplio. Token-bearing requests are never
  cached, and embeds, OG images and widgets stay anonymous.
- Claimed bots now show an "In Review" badge on the dashboard.

- When japi.rest is unreachable (for example Cloudflare 522s from the
  region our servers route through), the avatar fallback and Discord
  banner lookups now skip japi for 60s after the first failure instead of
  every avatar or banner request waiting 3-4s for a timeout.

## [1.2.0] - 2026-09-26

### Added


- Discord profile banners, via japi.rest. User profiles (`/user/[id]`)
  show the user's Discord banner, and render nothing if they don't have
  one. Bot pages fall back to the bot's Discord banner when no custom
  banner has been uploaded. Served by `/cdn/discord-banner/{users,bots}/{id}`,
  which mirrors into S3 and rechecks japi at most every 12h per
  user/bot, including caching "has no banner". Bot cards use the same
  fallback as the bot page, so the two always show the same banner.
  `Banner` gained `fallbackSrc` and `hideWhenMissing` props for this.

- Uploaded assets (team avatars; bot, server and team banners) now get
  content-versioned URLs. The upload gateway hashes each file, stores
  the hash as the S3 object's `asset-version` metadata, records it in
  Popplio, and returns it to the uploader. Pages render
  `/cdn/...?v=<hash>` from the entity's new `asset_versions` field, and
  `/cdn` serves a matching `?v=` as immutable. A re-upload is a new URL,
  so it shows up everywhere immediately. Partner logos are versioned in
  S3 metadata only (partners are Arcadia-managed, not Popplio).

### Fixed

- The homepage waited for the bot/server indexes to finish before even
  starting its stats, partners and blog requests. All five now start
  together.


- When the Discord avatar URL Popplio hands the mirror has gone stale (the
  hash 404s after an avatar change), the mirror now fetches the current
  avatar through japi.rest's avatar redirect instead of serving an old
  copy or the placeholder. This covers users and bots; guild icons can't
  be looked up this way.
- The user profile page used the raw Discord avatar URL instead of the
  avatar mirror, bypassing every fallback above.

- Discord avatars and server icons could keep showing the old image for
  up to 24h after a change. The avatar mirror only refetched once its
  copy was a day old, even when Popplio was already returning the new
  URL. The mirror now stores the Discord URL each copy came from and
  refetches as soon as the requested `src` differs. It proxies Discord
  directly when S3 is down, and falls back to the older copy (briefly
  cached) when Discord can't serve the new one.
- `/cdn` routes leaked pooled S3 connections. 304s and "refetch from
  Discord" responses opened an S3 body stream and never read or closed
  it, so under load the 50-socket pool filled up and images hung or
  failed at random. Conditional requests are now answered by S3 itself
  (`If-None-Match`, no body), and any unsent stream is cancelled.
- A transient S3 error (timeout, 5xx) was reported as a 404, so browsers
  cached a fallback image for an asset that was actually fine. S3 errors
  now return a `no-store` 503; only a genuinely missing key is a 404.
- Unversioned `/cdn` URLs were cached for 60s plus 300s of
  `stale-while-revalidate`, so a re-upload looked like it hadn't
  worked. They now revalidate on every use (a cheap 304).
- Pack emoji/sticker/sound keys are now write-once (the upload gateway
  rejects reusing an asset id), which lets `/cdn` serve them as
  immutable.

## [1.1.0] - 2026-09-02

### Added

- Emoji and sticker detail pages (`/emojis/[id]`, `/stickers/[id]`) now
  show a vanity short URL when one is set -- the same vanity system
  bots/servers/teams already use, resolved the same way (visiting by
  either the raw ID or the vanity code both work). Every emoji/sticker
  gets one automatically the moment it's uploaded; nothing is shown at
  all if it somehow doesn't have one.
- "More from {pack}" on emoji and sticker detail pages -- up to 6 other
  items from the same pack, since individual emojis/stickers have no
  tags of their own to match "similar" against.
- Dashboard → Packs can now edit emoji and sticker packs, not just
  bot/server ones -- rename, retag, add/remove/rename individual
  emojis/stickers (reusing the exact upload builder `/packs/add` already
  has), and set each item's short link, all from one place. This closes
  the one gap where editing lived on a public page instead of the
  dashboard like everything else on the site.
- Dashboard → Templates -- a server template's owner can now edit its
  description, tags, and NSFW flag, and delete it, from the same place
  every other listing is managed. Submission was always there; editing
  wasn't.
- `/collections` -- a page of hand-picked, named tag collections ("Best
  Music Bots," "Best Moderation Bots," "Best Gaming Servers," and more),
  each ranked automatically by votes rather than manually ordered. A
  4-tile teaser now also headlines the homepage, linking through to the
  full page.
- Themes -- `/themes` (browse), `/themes/{id}` (detail, with copy buttons
  for both colors), and `/themes/add` (submission: a name, two colors via
  a new color-swatch-plus-hex-text input, and up to 3 categories from a
  fixed list). A submitted theme renders as a profile-card mockup colored
  by its two hex values -- a matching border frame, a flat badge row, and
  a message-input strip, in the same spirit as discord.place's own theme
  gallery without copying its exact look -- built around the actual
  submitter's own avatar and username, not a generic "Discord"
  placeholder. Managed from Dashboard → Themes like everything else --
  list and delete, no separate edit (nothing about a theme is worth
  revising short of resubmitting it).
- Two new policies: a Developer & API Policy (acceptable use, key
  security, and rate-limit rules for anyone calling the API directly, not
  just the website) and a DMCA / Copyright Policy (how to file a
  takedown or counter-notice, sent to dmca@nodebyte.co.uk). The Service
  Agreement also now covers chargebacks and payment disputes, not just
  refunds, and the Privacy Policy discloses two third-party services it
  previously didn't: OpenAI (submitted bot/server descriptions, for
  moderation) and japi.rest (a bot's public Discord application data).

### Changed

- Footer reorganized -- Discover had grown to eight links while every
  other column sat at four or five, so Emojis/Stickers/Templates/
  Collections split out into their own "Content" column, and a
  "Community" column (Blog, Changelog, Leaderboard, Knowledge Base) was
  added since none of those pages had any footer visibility at all
  before now. Six balanced columns instead of one lopsided one.

## [1.0.0] - 2026-09-01

### Added

- Tag browse pages (`/tags/[tag]`) -- every tag on a bot or server's
  detail page is now a clickable link to a dedicated page listing every
  bot, server, team, and pack that shares that tag, sorted by votes.
  Reuses the existing search endpoint, no new backend work. No `/tags`
  index for now -- discovery is via clicking a tag on a detail page.
- `/emojis` is now a browse page for Emoji Packs instead of a live,
  per-server emoji/sticker viewer -- the pack backend already supported
  an `emoji` pack type (create/browse/detail all shipped previously),
  this just gives it a proper front door. A pack's detail page now has a
  "Download Pack (.zip)" button, entirely client-side: every emoji image
  is fetched and bundled into a zip in the browser, no new backend
  archive endpoint needed. `/packs/add?type=emoji` deep-links straight
  into the emoji-pack builder from the new page's "Create a Pack" button.
  The old live per-server emoji/sticker flat-browse UI (and its
  now-unused `getFlatEmojis`/`getFlatStickers` API calls) is removed --
  packs are curated and durable, which is a strictly better fit for
  "download and reuse elsewhere" than a live copy that vanishes if the
  source server leaves the platform. A server's own Emojis & Stickers tab
  is untouched; it never used the flat endpoints to begin with.
- A Server Template's detail page now shows what's actually in it -- a
  channel list (grouped by category, with type icons) and a role list
  (with real colors), pulled from Discord's own template data at
  submission time. It was already there, just never surfaced.
- Server templates can now be liked/disliked (a single persistent choice
  per user -- disliking something you'd liked switches it, clicking the
  same reaction again clears it, no cooldowns or credits involved) and
  reviewed, reusing the same `ReviewsSection` bot/server/team pages
  already use, unmodified.
- Sticker Packs -- a fourth pack type alongside Bot/Server/Emoji, built
  the same way (bundle up to 50 stickers you upload, `.zip` download,
  `/packs?pack_type=sticker` to browse). `/packs/add` gained a "Sticker
  Pack" option; `StickerPackBuilder` is `EmojiPackBuilder`'s counterpart,
  with the multi-file upload fix already baked in from the start.
- Every emoji and sticker now has its own page (`/emojis/{id}`,
  `/stickers/{id}`): full-size preview, animated badge, download count,
  a real Download button (separate from a whole-pack `.zip`, and
  actually increments that item's own count), who uploaded it, and which
  pack it's from.
- `/emojis` and `/stickers` are flat, sitewide browse pages for
  individual emojis/stickers -- closer to the old live-sync browse page's
  feel, but backed by durable pack uploads instead. Emoji/Sticker Packs
  themselves are still fully browsable, just at `/packs?pack_type=emoji`/
  `sticker` now instead of at these URLs.

### Fixed

- The shop's vote history no longer shows a redeemed vote as a plain "Vote
  #N" entry -- it's grouped as a "redeemed for credits" line the same way
  it was before, now keyed off `credit_redeem` instead of the `void` flag
  (backend fix: redeeming credits no longer voids the vote at all, see
  popplio's changelog -- it was silently deflating the entity's public
  vote count).
- Voting on a bot, server, team, or pack updated the vote button's own
  label immediately, but everything else on the page showing that vote
  count (the Stats sidebar, a pack's header count) stayed on the number
  the page was server-rendered with until a manual reload. All four vote
  buttons now call `router.refresh()` right after a successful vote, so
  the whole page catches up -- the backend was already updating the count
  synchronously, this was purely the page not re-fetching it.
- Uploading an emoji while creating a new Emoji Pack always failed with
  "You don't have permission to do this." -- the upload endpoint checked
  team-based entity permissions for the pack, but packs aren't team-owned
  (a pack's permission is just "are you its `owner`", checked directly by
  Popplio) and, more fundamentally, the pack doesn't exist yet at that
  point in the create flow, so the permission lookup always failed with
  "pack not found" no matter who was uploading. Creating a pack at any
  free URL never required special permission to begin with, so a
  not-yet-created pack is now allowed through; an *existing* pack (the
  case that matters, e.g. re-uploading an emoji after edits) still checks
  real ownership, now via the pack's own `owner` field instead of a
  permissions lookup that pack entities were never wired into.
- The Add Bot confirmation screen crashed with a bare `TypeError` for most
  new submissions -- `botMeta.flags` came back `null` from the backend
  whenever the lookup resolved via Discord's own RPC endpoint (the
  now-preferred path, only the JAPI fallback ever populated flags), and
  the confirmation screen called `.map()` on it directly. Backend fix:
  Popplio's changelog. Guarded here too (`botMeta.flags ?? []`) so the
  page degrades instead of crashing if this shape gap ever recurs.
- A pack's detail page (`/packs/{url}`) has been reworked to match the
  layout bot/server pages already use -- a two-column grid with Vote/
  Download in a real actions card, a Stats card, an Owner card, and the
  Widget share panel tucked into the sidebar instead of one giant inline
  block shoved above the fold. Previously packs were the one entity type
  still on an older single-column layout with no sidebar at all.
- Pack emoji images occasionally failed to serve from cache with a `403`
  logged server-side (`[s3] getObject(...) failed: ... httpStatusCode:
  403`), even though the same image had just loaded fine moments earlier
  -- traced to the AWS SDK's newer checksum-calculation default, which
  adds checksum headers to the request signature that our S3-compatible
  storage doesn't validate the same way real AWS S3 does. Most visible on
  the CDN route's conditional-request (`HeadObjectCommand`) path, though
  it could affect any operation. Set back to `WHEN_REQUIRED`, matching
  what every non-AWS S3-compatible backend actually expects.
- Server Templates now have a real detail page (`/templates/{id}`),
  matching the layout every other entity type uses -- sidebar actions,
  Stats, and a Submitted-by card, plus an owner-only delete action. The
  browse card's title now links there (it didn't link anywhere before).
  "Use Template" on both the card and the new page, and "Add to Server"/
  "Join Server" on bot/server pages, all switched from a hardcoded black/
  white pill to the accent-colored button style everything else on the
  site already respects -- Customize's accent color didn't reach any of
  these three before.
- Selecting multiple files at once in the emoji pack builder uploaded all
  of them but only kept the last one -- each file's `onChange` call was
  computed from the same stale `emojis` prop the loop started with, so
  every call in a batch overwrote the previous one instead of building on
  it. Uploading one at a time happened to work fine, which is exactly why
  this went unnoticed. Fixed by accumulating the batch locally instead of
  re-reading a prop that was never going to update mid-loop.

## [0.4.3] - 2026-08-31

### Added

- A Server Templates directory (`/templates`, linked from Browse) --
  browse/tag-filter user-submitted Discord server templates and clone one
  straight into your own server with one click. `/templates/add` to
  submit one: paste a template code, Discord's own metadata fills in the
  name. No review queue, same trust model as packs -- owners can delete
  their own submissions inline from the card.
- The shop page now shows a list of available public coupon codes (when
  there are any that actually apply to the selected bot/server) above the
  manual code field, with a one-click "use this code" fill-in -- coupon
  redemption shipped in 0.4.2, but the only way to use one was already
  knowing the code.
- The homepage Partners section is now an auto-scrolling marquee instead
  of a static wrapped grid multiple rows, alternating scroll direction,
  once there are enough partners to make that worthwhile (falls back to
  the plain grid for a short list). Pauses on hover and respects
  prefers-reduced-motion.
- Teams and packs can now redeem their earned votes into shop credits, the
  same as bots and servers a "Credits" tab on team settings, and a
  "Credits" button on each pack in the dashboard's Packs tab. There's
  nowhere to spend credits yet outside the shop, which stays bot/server-
  only for now, so this banks them for when that changes rather than
  pretending a purchase flow exists. Backend note: this uncovered that the
  votes-to-credits ladder had no rows configured for anything but bots --
  fixed on the popplio side, and it silently affected the existing server
  flow too.
- Other bots/servers sharing tags with the one you're viewing now show up
  in a "Similar Bots"/"Similar Servers" section at the bottom of the page
  -- ranked by how many tags they share.
- A Voter Leaderboard page (`/leaderboard`, linked from the Community
  menu) -- the most active voters, all-time, by total upvotes cast. Not
  scoped to the current voting cycle, so a consistently active voter keeps
  their standing across the monthly automated reset instead of getting
  wiped every time it runs.
- Team settings' Overview tab is now an actual activity dashboard instead
  of a static welcome blurb votes, members, bots, servers, reviews
  (with average rating), and banked vote credits as stat cards, plus a
  webhook activity summary (configured count + logged deliveries) for
  members with webhook permissions. All data reused from existing
  endpoints, nothing new on the backend.

### Fixed

- The shop page's bot/server picker only ever showed bots you owned
  directly, not ones you manage through a team -- backend fix (popplio's
  `user_bots` union), see its changelog.
- Vote history no longer repeats an identical row per vote a single reset
  event touched -- votes voided by the same event (same reason, same
  timestamp) now collapse into one summary row instead of a wall of
  copies. "Vote credits redeemed" also gets neutral styling instead of
  alarming red, since that one's an intentional, positive outcome.
- "Enable push notifications" failed every time on Chrome with
  "Notification permission was not granted," no dialog ever shown --
  `Notification.requestPermission()` was called after awaiting service
  worker registration, which silently burns through the user-gesture
  window the permission prompt needs. Now requested first.

## [0.4.2] - 2026-08-30

### Added

- Search now covers teams and packs, not just bots and servers -- the
  `/search` page's results grid gets a "Teams" and "Packs" section
  alongside Bots and Servers, using the same query/tag filters. The
  backend index only ever covered bots/servers before; that's what the
  page's own comment used to say, until today.
- A coupon-code field on the shop page -- Popplio's checkout now actually
  accepts one. The admin coupon catalog has existed for a while with
  nowhere to redeem a code; there is now.

## [0.4.1] - 2026-08-29

### Added

- Teams and packs can now be voted for, matching bots and servers -- an
  upvote/downvote button on both pages, with the same cooldown, weekly
  double-vote bonus, and "are you sure?" downvote confirmation. Voting on
  these was already fully supported by the API; the buttons just weren't
  built yet.
- Team pages can now be reported and reviewed, the same as bots, servers
  (and, for reporting, packs) already could -- both were already fully
  supported by the API with no frontend caller.
- A "Webhooks" tab on team settings, so a team can receive the same
  webhook events a bot or server can opplio already had a working
  team webhook driver with no way to configure one from the site.

## [0.4.0] - 2026-08-27

### Added

- A notification preferences panel on the dashboard's Notifications tab --
  8 toggles (Bot & Server Reviews, Votes & Reminders, Payments & Premium,
  Shop, Webhooks, Staff Applications, Reports, Account & Security) let you
  mute whole categories of alert instead of it being all-or-nothing.
- High-priority notifications (payment failures, account bans, and
  similar) now actually look different in the bell -- an "Urgent" badge
  and a red accent, and they sort to the top instead of being mixed in
  with routine alerts. The underlying priority field existed before this
  but had no effect in the UI.
- iOS Safari silently can't receive push notifications unless the site's
  been added to the Home Screen first, with no error or explanation. The
  bell's push section now detects this and shows an actual "Add to Home
  Screen to enable notifications" hint instead of a flat "not supported"
  dead end.

### Fixed

- Vote reminders now actually show up in the notification bell -- they
  were being sent as push-only and silently never saved to your inbox
  (Popplio-side fix; see its changelog).

## [0.3.0] - 2026-08-25

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
- The admin queue's server cards now show Discord's own guild-level NSFW
  classification (`discord_nsfw_level`, synced by Infernoplex) as a small
  "Discord: Explicit/Safe/Age-Restricted" label when it's not the default,
  alongside the existing gated-channel-count badges. Previously computed
  and typed but never rendered anywhere — a reviewer could see the derived
  channel count but not Discord's own classification behind it.
- A server's Emojis & Stickers tab now shows "Last synced" (relative time)
  when `emojis_synced_at` is set, so it's clear whether the gallery
  reflects the server's current state or a stale sync. Threaded through
  `ServerPageTabs` → `EmojiStickerGallery`.
- `useEntityPermission(targetType, targetId)` hook centralizes the
  "resolve my permissions on this bot/server/team/pack" fetch that used to
  be hand-copied at every call site. The two copies had already drifted:
  `BotPageTabs` compared perms with a raw `.includes("edit_bots")` instead
  of `hasPermString` (broke for a direct owner, whose perms come back as
  `["owner"]`, a super-permission the bug fixed a few versions back),
  while `TeamManageLink` didn't guard against a stale response landing
  after unmount at all. Both now use the hook; `teams/[id]/settings`
  deliberately wasn't migrated — it already used `hasPermString` correctly
  and its perms fetch is part of a larger coordinated load, not a
  standalone gate.
- `AdminListRow`/`AdminEmptyState` (`src/components/admin/AdminListRow.tsx`)
  and a promoted `StatCard` (`src/components/admin/StatCard.tsx`) the
  "rounded card row with edit/delete actions" and "No X yet." markup was
  hand-duplicated across every admin CRUD list page (badges, blog, staff
  templates, and all five shop catalogs), and `StatCard` was local to the
  dashboard overview page only. Nine list pages now share the row
  component; `partners`, `staff/positions`, and `staff/members` weren't
  migrated since they each render a leading avatar or reorder-arrow column
  before the content that the row's two-slot (`children`/`actions`) API
  can't represent without changing their layout.
- Deep links to a specific review or bot changelog entry `?review=<id>` on a bot/server page and `?changelog=<id>` on a bot page
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
- `/about/team` — a public team page listing staff (avatar, name, and the
  position(s) they hold), backed by Popplio's new public `GET
  /staff/team`. Linked from the footer and `/about`.
- Server counts on `/about/moderation`'s pipeline/safety tables (a "Server
  review pipeline" table alongside the existing bot one, and "Vote-Banned
  Servers" in platform safety) Popplio's `GET /list/stats` had bot
  counts from the start but no server equivalent, so the page could only
  ever show half the picture.
- Client-side rejection of obvious XSS payload markup (`<script>`,
  `javascript:`/`vbscript:` URLs, inline event handlers, `<svg>`/
  `<object>`/`<embed>`/`<meta>`, legacy CSS `expression()`) on the bot/
  server "Add" forms and the bot edit modal, via a new
  `containsSuspiciousMarkup`/`suspiciousMarkupError`
  (`src/lib/utils/detectSuspiciousContent.ts`), mirroring Popplio's new
  `noxss` field validator so a bad paste gets a specific error immediately
  instead of round-tripping to the API to find out. The API-side check is
  the actual enforcement (this only covers the two most common entry
  points, not every field it now also validates server edit, review
  create/edit still rely on the API's rejection alone).
- A real Spotlight section on the home page, backed by Popplio's new
  staff-only `SpotlightAdd`/`SpotlightRemove` RPC action and `spotlight`
  index field. Previously "Spotlight" was just a relabeling of the
  certified+premium tabs with no staff control of its own; that section
  is now labeled "Highlights" instead, and Spotlight shows whatever staff
  actually chose to spotlight.

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

- The home page's Featured section only ever rendered
  `botIndex?.featured` servers with an active `featured_until` were never
  shown even though Popplio's index endpoint already returned them. Now
  reuses `HomeTabs` (bots/servers toggle) the same way the
  certified/premium and Spotlight sections already did.
- The admin panel's duration field (used by Add Premium/Featured/
  Spotlight) rendered as a bare number input labeled "Time [X unit(s)]"
  with a placeholder claiming the format was "X years/days/hours" even
  though Popplio only ever accepts a plain hour count. Staff typing "30
  days" into it, per the placeholder's own suggestion, would submit that
  literal string and fail. `GenericRpcModal` now renders a number input
  plus an hours/days/weeks/years unit dropdown for any `Hour` field and
  converts to hours before submission, so the field behaves the way its
  label always implied.
- `/admin/templates` and `/admin/badges` weren't linked from the admin
  nav — added "Templates" next to "Badges" under Content in
  `Header.tsx`'s `ADMIN_NAV_LINKS`.
- `generateMetadata()` on bot/server/team/pack/blog/user pages fetched
  the full entity (votes, long description, everything) just to read a
  name and short description for `<title>`/`<meta>` tags. Popplio already
  ships purpose-built lightweight `*/seo` endpoints for exactly this
  ("used by v4 website for meta tags," per their own doc comments) that
  the current frontend never called. Each resource client now has a
  `getSeo()` alongside its full fetch, and every `generateMetadata()`
  uses it instead — same output, a much cheaper query per page load. Bot
  and server pages keep their vanity-URL fallback (the `/seo` routes take
  a raw ID, not a vanity slug, same as their full-entity counterparts).
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
- Staff Panel sign-in on prod failed with a misleading "Method Not Allowed"
  whenever `NEXT_PUBLIC_ARCADIA_URL` was configured with a trailing slash:
  `postQuery()` always appends its own `/`, so the request landed on a
  double-slash URL, which the panel API 301-redirects to the real path —
  and per the Fetch spec, a `POST` following a `301` is replayed as a `GET`,
  which the panel API correctly (but confusingly) rejects with
  `405 Method Not Allowed`. `ARCADIA_URL` now strips any trailing slash.
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
