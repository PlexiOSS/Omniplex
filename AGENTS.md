<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Omniplex — Agent & Contributor Guide

## Project overview

Omniplex is a Discord bot and server list built with **Next.js 16 App Router**, **Tailwind CSS v4**, and **TypeScript**. The backend API is called **Popplio**; the default base URL is set in `src/lib/api/config.ts` and overridable via `NEXT_PUBLIC_API_URL` (see env var table below — do not hardcode a hostname elsewhere, it will drift). This frontend is intentionally decoupled from the API — swapping the backend means changing `src/lib/api/` only.

---

## Working across the plexicore workspace

This `agents/` directory lives at the root of a multi-repo workspace, not inside any single project — treat it as the shared entry point for every repo below, not an Omniplex-only doc (the rest of this file is still mostly Omniplex-specific detail; add sibling-repo sections here as they need their own standards documented).

Sibling repos, as of this writing:

| Repo | What it is |
|---|---|
| `omniplex/` | This frontend (Next.js). |
| `popplio/` | The Go backend API this frontend talks to. Source of truth for every payload shape — when a frontend type and the backend struct disagree, read the Go struct, don't guess. |
| `arcadia/` | The Rust staff-panel backend (`panel-api`) — both a Discord bot and an axum HTTP microservice. Single-endpoint RPC dispatch (`PanelQuery` tagged union), not REST. Powers `omniplex/src/app/admin`. |
| `infernoplex/` | The Rust Discord bot that tracks/lists servers. Slash-command only; deliberately requests no privileged gateway intents (member/presence data comes from REST, e.g. `with_counts=true` and per-member lookups, not the gateway cache), so it never needs to go through Discord's intent-verification review. |
| `kittycat/` | The permission model shared by Popplio (Go), Arcadia (Rust), and Infernoplex (Rust) as a real dependency, and hand-ported (a deliberately-scoped subset) into Omniplex (`src/lib/permissions.ts`) for client-side UI gating. `namespace.perm` strings, wildcard (`*`)/negator (`~`) semantics, and position-hierarchy resolution (`resolve()`) — implemented independently per language and required to stay behaviorally identical; check its own `CHANGELOG.md`/README before assuming behavior, and update all language implementations together if you touch the resolution algorithm. |
| `botox/` | Shared Rust utility crate (help-command pagination, task scheduling) consumed as a git dependency by Infernoplex and Arcadia. |
| `reedwhisker/` | The legacy Next.js Pages-Router site being replaced by Omniplex. Useful as a reference for what a feature *used* to do, but don't assume it's still correct — it's been wrong or simply absent (e.g. it never had a working "add a server" flow either) more than once. |
| `legacy-panel/` | The old SvelteKit staff panel, superseded by `omniplex/src/app/admin` + `arcadia`. Reference only. |

Each repo keeps its own `CHANGELOG.md` (Keep a Changelog format). Update the changelog in whichever repo(s) you actually touched as part of finishing a task, not as an afterthought — see each changelog's own "Unreleased" version header for the convention (most of these repos aren't tagged/released yet, so everything currently accumulates under the first pending version).

### Cross-repo workflow standards

- **Don't guess a backend contract — read the source.** Before wiring a frontend form/type to an endpoint, read the actual Go struct (Popplio) or Rust type (Arcadia) and its `validate`/`db` tags. Assumptions about field names, required-ness, and enums have been wrong often enough this is a hard rule, not a suggestion.
- **Verify after every edit, every time, no exceptions:**
  - Go: `gofmt -w <files>` then `go build ./...`.
  - TypeScript: `bunx biome check --write <files>` then `bunx tsc --noEmit`. In the Omniplex monorepo, run `tsc` per package (or `bunx turbo run typecheck` from the repo root), since each package has its own `tsconfig.json`.
  - Python (`omniplex/packages/sdk-python`): `ruff check src tests`, `ruff format --check src tests`, `mypy src`, then `pytest`.
  - Go SDK (`omniplex/packages/sdk-go`): `gofmt -l .` (must print nothing), `go vet ./...`, then `go test ./...`.
  - Rust SDK (`omniplex/packages/sdk-rust`): `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, then `cargo test`.
  - Never report a change as done without having run all of them for the files you touched.
- **Don't assume backend data is enum-restricted just because the frontend UI looks like a fixed list.** Tags, for example, have never been restricted to an enum server-side — a frontend "pick from these 12" widget was silently hiding real tags outside that list. When building a picker/selector over backend-controlled data, always render values the UI doesn't recognize as visible, removable chips rather than dropping them.
- **Permission/entity catalogs are hand-maintained and drift.** Arcadia has no live permission-catalog endpoint; Omniplex's `STATIC_PERMISSION_CATALOG` is grepped-by-hand from Arcadia's Rust source. Any UI built over such a catalog must surface out-of-catalog values it finds in real data (see `ArcadiaPermSelector`'s "Other granted permissions" pattern) instead of silently hiding them.
- **A UI control's checked/selected state should reflect *effective* truth, not just the one layer being edited.** A permission granted via a staff position and one granted via a per-member override both need to show as "on" — only the override layer is what gets saved, but the checkbox has to reflect the resolved combination or it reads as "the site doesn't respect my actual permissions."
- **Don't fabricate a fix for a live bug report — reproduce it first.** Curl the real API, grep the actual DB-facing Go/Rust code, or write a tiny throwaway script against the real sanitizer/validator function before proposing a fix. Several bugs this session (team votes not resolving, presence not showing, tags not matching) turned out to have a different root cause than the first plausible guess.
- **Security/scope tradeoffs are the user's call, not yours to silently decide.** Things like "allow arbitrary `<iframe>` src" are real, named risks — use `AskUserQuestion` to present the tradeoff and options rather than picking one silently, and don't water down an explicit choice the user already made (e.g. don't sneak in a restrictive `sandbox` attribute after they said "allow any src").

---

## Tech stack

| Layer | Tool |
|---|---|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS v4 with `@tailwindcss/postcss` |
| Fonts | Geist + Geist Mono (next/font/google) |
| Theme | `next-themes` (class-based dark mode) |
| Data fetching | `swr` (client), native `fetch` (server components) |
| Icons | `lucide-react` |
| Linter / formatter | Biome 2 (2-space indent, single quotes) |
| Package manager | Bun |

---

## Monorepo layout (Omniplex `monorepo` branch)

The `monorepo` branch turns `omniplex/` into a Turborepo monorepo. Until it's merged into `master`, `master` still has the old single-app layout. Once it's merged:

| Path | Package | What it is |
|---|---|---|
| `apps/web/` | `@omniplex/web` | The website. Every `src/...` path in the rest of this file is relative to `apps/web/`. |
| `apps/docs/` | `@omniplex/docs` | docs.omniplex.gg, on Fumadocs 16 (same Next/React/Tailwind as the website). Brought in with `git subtree` from the old Documentation repo, history included. MDX pages in `content/docs/`. The API reference pages are built from the committed `openapi.json` snapshot by `fumadocs-openapi` 12 at build time (refresh it with `bun run openapi`); only `api-reference/index.mdx` and `meta.json` are files. Release workflows keep OIDC (`id-token: write`) in a publish-only job, separate from build and test, and pin every action to a commit SHA. Deployed on Dokploy from `apps/docs/Dockerfile` (repo root as context, port 3001). `bun run dev:docs` runs it locally. |
| `packages/api-types/` | `@omniplex/api-types` | The API types, formerly `src/lib/api/types.ts`. The website's `src/lib/api/types.ts` is now one line that re-exports this package, so imports from `@/lib/api/types` still work. Add or change API types here. Runtime values don't belong in it (`ALERT_CATEGORY_LABELS` moved to `apps/web/src/lib/constants/alertCategories.ts`). |
| `packages/sdk-js/` | `@omniplex/sdk` | The JavaScript and TypeScript SDK, published to npm. |
| `packages/sdk-python/` | `omniplex-sdk` | The Python SDK, published to PyPI and imported as `omniplex`. It isn't a Bun workspace. |
| `packages/sdk-go/` | `github.com/PlexiOSS/Omniplex/packages/sdk-go` | The Go SDK (package `omniplex`), standard library only. Released by tagging `packages/sdk-go/vX.Y.Z`, the tag form Go requires for a module in a subfolder; `publish-go.yml` then asks the Go proxy to fetch it so pkg.go.dev lists it. |
| `packages/sdk-rust/` | `omniplex` (crates.io) | The Rust SDK, async on tokio + reqwest (rustls). Minimum Rust 1.85, set by reqwest. Its `target/` is ignored by Git and Docker. |

- Run `bun install`, `bun dev`, `bun run build`, `bun run lint`, `bun run typecheck` and `bun run test` from the repo root. They go through Turborepo. Bun uses the hoisted linker (`bunfig.toml`).
- The `Dockerfile` stays at the repo root with the whole repo as its build context, so Dokploy needs no changes, and it runs the site from `apps/web`. Its install stage copies each workspace's `package.json` by name for `--frozen-lockfile`. **When you add a JS package or app, add its `package.json` to the `manifests` stage of both the root `Dockerfile` and `apps/docs/Dockerfile`**, or their image builds fail.
- In `apps/web` and `apps/docs`, `typecheck` runs after that app's `build` (their own `turbo.json`), because `next build` rewrites `.next/types` while `tsc` reads it. Don't remove that ordering to make CI faster.
- There's no global `js-yaml` override: Bun overrides apply to every package, and Fumadocs needs js-yaml 4 while `gray-matter` needs 3. Each resolves to a patched release on its own.
- Local overrides go in `apps/web/.env.local`.
- The SDKs follow Popplio's contracts: `POST /bots/stats` and `POST /servers/stats` with the raw API session token as `Authorization`, the public `GET /users/{uid}/{bots|servers}/{id}/votes`, and webhook verification for `hmac-sha256`, `splashtail` (the default for webhooks without HMAC) and `simple-auth`. The webhook test fixtures in both SDKs were produced by Popplio's own `sealPayload` and HMAC code. If Popplio's signing changes, regenerate them from Popplio rather than editing them by hand.
- Packages release from their own tags (`sdk-js@v*`, `api-types@v*`, `sdk-python@v*`, `sdk-rust@v*`, and `packages/sdk-go/v*` for Go) through trusted publishing (Go needs none), and the website still releases from `v*` tags. The release runbook is kept out of the public repo, in the workspace root as `omniplex-releasing.md`.
- Popplio's changelog drafts task reads `apps/web/CHANGELOG.md` for Omniplex and falls back to the root `CHANGELOG.md`, so it works before and after the merge.
- It also drafts entries for every `packages/<name>/CHANGELOG.md` it finds on GitHub, stored as project `omniplex` with `package` set to the folder name. A new package is picked up with no Popplio change, as long as its folder name is lowercase letters, digits and hyphens and its changelog uses `## [x.y.z] - date` headings. Give it a readable name in `PackageLabel` (Popplio `changeloggen/repos.go`) and `packageLabel` (`apps/web/src/lib/changelog.ts`); otherwise `sdk-<lang>` falls back to "<Lang> SDK" and anything else shows the folder name.

## File structure

This tree is illustrative, not exhaustive — read the actual directory before assuming a file exists. In the monorepo it lives under `apps/web/`.

```
src/
├── app/                         # App Router pages & layouts
│   ├── layout.tsx               # Root layout — ThemeProvider, CustomizationProvider, Header, Footer
│   ├── page.tsx                 # Home page (server component)
│   ├── not-found.tsx / error.tsx / opengraph-image.tsx / robots.ts / sitemap.ts / manifest.ts
│   ├── about/
│   │   ├── page.tsx             # About page
│   │   └── status/page.tsx      # Status page
│   ├── auth/
│   │   ├── login/page.tsx, LoginButton.tsx   # Discord OAuth entry point
│   │   ├── callback/page.tsx    # Stale bookmark redirect → /auth/login (old callback URL)
│   │   └── sauron/page.tsx      # Actual OAuth callback handler — exchanges `code`, stores session
│   ├── blog/
│   │   ├── page.tsx, opengraph-image.tsx
│   │   └── [slug]/page.tsx, opengraph-image.tsx
│   ├── bots/
│   │   ├── page.tsx, layout.tsx, error.tsx
│   │   ├── add/page.tsx         # Bot submission form
│   │   └── [id]/
│   │       ├── page.tsx         # Bot detail (server component)
│   │       ├── VoteButton.tsx   # Vote action (client component)
│   │       ├── opengraph-image.tsx
│   │       ├── widget/route.tsx # Public PNG embed widget (ImageResponse)
│   │       └── not-found.tsx
│   ├── servers/                 # Mirrors bots/ (page, layout, error, add/, [id]/ with ServerVoteButton.tsx, widget/)
│   ├── packs/
│   │   ├── page.tsx, add/page.tsx
│   │   └── [id]/page.tsx, opengraph-image.tsx, widget/route.tsx
│   ├── dashboard/
│   │   ├── page.tsx             # Tabbed dashboard: profile, bots, packs, customization
│   │   ├── BotEditModal.tsx, PackEditModal.tsx, PacksTab.tsx
│   ├── kb/
│   │   ├── page.tsx             # Landing — search + category cards
│   │   └── [category]/
│   │       ├── page.tsx         # Category listing
│   │       └── [slug]/page.tsx  # Article — sidebar nav + rendered Markdown
│   ├── search/
│   │   ├── layout.tsx, page.tsx # Interactive search (client component)
│   └── user/[id]/
│       ├── page.tsx             # User profile (server component)
│       └── opengraph-image.tsx
│
├── components/
│   ├── providers/
│   │   ├── ThemeProvider.tsx    # Wraps next-themes
│   │   └── CustomizationProvider.tsx  # Accent colour + stat-visibility context
│   ├── layout/
│   │   ├── Container.tsx, Header.tsx, Footer.tsx, NavGroupMenu.tsx, ServiceUnavailable.tsx
│   ├── ui/                      # Primitive building blocks
│   │   ├── Avatar.tsx, Badge.tsx, Button.tsx, Input.tsx, Modal.tsx, Skeleton.tsx
│   │   ├── TagPicker.tsx, CustomizationPanel.tsx, BrandIcons.tsx, OmniplexLogo.tsx
│   ├── cards/
│   │   ├── BotCard.tsx, ServerCard.tsx, PackCard.tsx
│   ├── home/
│   │   ├── HomeTabs.tsx, ActivityStrip.tsx
│   ├── search/
│   │   ├── SearchBar.tsx, Pagination.tsx
│   ├── markdown/
│   │   ├── Markdown.tsx         # react-markdown pipeline (remark-gfm/breaks, rehype-raw/sanitize)
│   │   ├── sanitizeSchema.ts, sanitizeStyle.ts, rehypeSanitizeStyle.ts
│   ├── widget/
│   │   └── WidgetShare.tsx      # Copy-embed-code UI for public widget routes
│   └── kb/
│       ├── KbSidebar.tsx        # Persistent category/article nav (server component)
│       └── KbSearch.tsx         # Client-side search box on the /kb landing page
│
├── hooks/
│   ├── useAuth.ts, useMe.ts, useOAuthMeta.ts   # Session + current-user data
│   ├── useBots.ts, useServers.ts, useSearch.ts, useVote.ts
│   └── useCustomization.ts      # Reads/writes accent colour + stat visibility
│
└── lib/
    ├── api/
    │   ├── config.ts            # API_URL, CDN_URL — change these to swap backends
    │   ├── types.ts             # All TypeScript types for API responses
    │   ├── client.ts            # Base fetch wrapper (client.get/post/patch/delete)
    │   ├── index.ts             # Re-exports: `bots`, `servers`, `packs`, `search`, `users`, `auth`, `blogs`, `vanity`, `list`
    │   └── resources/
    │       ├── bots.ts, servers.ts, packs.ts, search.ts, users.ts, auth.ts, blogs.ts, vanity.ts, list.ts
    ├── constants/
    │   ├── accent.ts             # AccentColor type + single source of truth for accent options
    │   └── tags.ts                # BOT_TAGS
    ├── og/
    │   ├── image.ts, shared.tsx  # Shared OG image helpers (toOgImageSrc, layout primitives)
    ├── widget/
    │   └── shared.tsx            # WidgetFrame/WidgetStat, resolveVisibleStats, per-entity stat key arrays
    ├── kb/
    │   ├── categories.ts          # KB_CATEGORIES — category metadata (title/description/order)
    │   └── content.ts             # fs + gray-matter loader for src/content/kb/**/*.md
    ├── social.ts                 # Social platform icon/link helpers
    └── utils/
        ├── format.ts             # formatCount, formatRelativeTime, formatCountdown, truncate
        ├── assets.ts              # CDN URL builders, resolveAsset, botUrl, serverUrl
        ├── auth.ts                # localStorage session helpers (getSession, saveSession, clearSession)
        └── errors.ts              # isApiUnavailable (server components), isBoundaryApiError (error.tsx)
```

---

## API layer — how to use and extend

### Using the API in server components (preferred for initial data)

```tsx
import { bots } from "@/lib/api";

export default async function BotPage({ params }) {
  const bot = await bots.getBot(params.id);
  return <div>{bot.user.username}</div>;
}
```

### Using the API in client components (via SWR hooks)

```tsx
import { useBotList } from "@/hooks/useBots";

export default function BotsPage() {
  const { data, isLoading } = useBotList(1);
  ...
}
```

### Calling the API directly in a client component

```tsx
import { client } from "@/lib/api";
const data = await client.get<MyType>("/some/endpoint", { token, cache: "no-store" });
```

### Adding a new resource

1. Create `src/lib/api/resources/myresource.ts`
2. Export functions that call `client.get/post/patch/delete`
3. Add the type shapes to `src/lib/api/types.ts`
4. Re-export from `src/lib/api/index.ts`

### Swapping the backend entirely

1. Update `API_URL` in `src/lib/api/config.ts`
2. Update type shapes in `src/lib/api/types.ts` to match the new API
3. Update resource functions in `src/lib/api/resources/` to match new endpoint paths and request/response shapes
4. Nothing in `components/`, `hooks/`, or `app/` needs to change

---

## Authentication

- Session stored in `localStorage` under the key `wistala` as `{ token, user_id, expires_at }`, and mirrored into a first-party `omniplex_session` cookie (`saveSession`/`clearSession` in `src/lib/utils/auth.ts`) so server-rendered pages can act as the viewer. Read it server-side with `getServerToken()` (`src/lib/utils/serverSession.ts`).
- `useAuth` hook reads/writes/clears the session; subscribe to it for reactive auth state
- Auth token is passed as `Authorization: User {token}` by the API client automatically
- **Server-side calls with a user token must go through `client` (`src/lib/api/client.ts`), never a raw `fetch`.** Popplio rejects a user session whose `Origin` isn't `sites.frontend` unless the user is a Bug Hunter (that rule exists to keep staging/preview frontends Bug-Hunter-only). Browsers send `Origin` themselves; on the server `client` adds `Origin: NEXT_PUBLIC_BASE_URL` whenever it sends a token. A raw server-side `fetch` with a token gets a 403 for every regular user, which is how "Bot not found for logged-in users" happened. Popplio logs these rejections as "Rejected user session from a non-frontend origin".
- Public read routes that change with the viewer (`GET /bots/{id}`, `/servers/{id}`, `/teams/{id}`, `/users/{id}` and their sub-resources) use `AuthOptional`: a missing, invalid, banned or wrong-origin session is treated as anonymous rather than rejected, so a public page can never break because of who is viewing it. Requests that send a token must be `cache: "no-store"` so one viewer's response is never cached for another.
- Production `sites.frontend` (Popplio) and `NEXT_PUBLIC_BASE_URL` (Omniplex, baked in at build time) must use the same host.
- OAuth flow: `/auth/login` → Discord → `/auth/sauron?code=...` → `auth.callback(code, client_id, redirectUri)` → `login(session)`. `/auth/callback` is a dead route kept only to redirect old bookmarks back to `/auth/login`.

---

## Styling conventions

- **Colours**: Use `zinc` scale for all neutrals. Never use `gray`, `slate`, or `neutral` unless specifically needed.
- **Dark mode**: Class-based via `next-themes`. Use `dark:` prefix on all colour utilities. Never rely on `@media (prefers-color-scheme)` alone.
- **Spacing**: Prefer Tailwind spacing utilities. No custom CSS unless unavoidable.
- **Borders**: `border-zinc-200 dark:border-zinc-800` for dividers and card borders.
- **Cards**: `rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900`
- **Transitions**: Use `transition-colors` for colour shifts. Avoid heavy animations.
- **Prose / long descriptions**: Apply the `.prose` class. These render HTML from the API.
- **`overflow-x-auto` alone can silently enable vertical scrolling too**: per the CSS spec, setting only `overflow-x` to a non-`visible` value force-computes the other axis to `auto` as well. If you only want horizontal scroll, pair it with an explicit `overflow-y-hidden`.
- **CSS Grid items default to `min-width: auto`**: unwrappable content (a long tag, an unbroken description string) inside a grid item can grow the whole column past its track width and overflow the page horizontally, even though visually each card looks fine on its own. Add `min-w-0` to grid item roots (card components) and to any flex-wrap row inside them that holds variable-width content.

---

## Component conventions

- Server components by default — only add `"use client"` when the component needs hooks, event handlers, or browser APIs.
- Co-locate client-only sub-components with their parent page (e.g. `VoteButton.tsx` next to `page.tsx`).
- Props interfaces use plain TypeScript `interface`, defined at the top of the file.
- No default exports for UI components — use named exports.
- Pages use default exports (required by Next.js).
- **Never render a `<form>` inside a shared/reusable component** (`TagPicker`, `LinksEditor`, etc.) — these get embedded inside page-level `<form>` elements (add/edit pages, edit modals), and a nested `<form>` is invalid HTML that React 19 will hard-error on during hydration. Handle Enter-to-submit with `onKeyDown` on the input and a `type="button"` + `onClick` instead of `type="submit"` in a wrapping `<form>`.
- **No em dashes in user-facing copy** unless there's genuinely no cleaner way to phrase it — prefer a period, "and", or restructuring the sentence.

---

## Error handling

### "Service unavailable" vs generic errors

Two helpers in `src/lib/utils/errors.ts` determine which UI to show:

| Helper | Where used | What it checks |
|---|---|---|
| `isApiUnavailable(err)` | Server components (`page.tsx`) | `ApiError` with status 502/503/504/408, or `TypeError` (network failure) |
| `isBoundaryApiError(err)` | `error.tsx` client boundaries | `error.name === "ApiError"` or fetch TypeError (serialised by Next.js) |

**Server component pattern** — catch before rendering:
```tsx
try {
  data = await bots.getAll();
} catch (err) {
  if (isApiUnavailable(err)) return <ServiceUnavailable />;
  notFound(); // or throw for unexpected errors
}
```

**Error boundary pattern** — Next.js 16 uses `unstable_retry` (not `reset`):
```tsx
"use client";
export default function MyError({ error, unstable_retry }) {
  if (isBoundaryApiError(error)) return <ServiceUnavailable onRetry={unstable_retry} />;
  return <GenericError onRetry={unstable_retry} />;
}
```

The `ServiceUnavailable` component accepts `inline` (renders as a section, not full-screen) and `onRetry` (calls `unstable_retry` or `window.location.reload`).

---

## Metadata file conventions (Next.js 16)

| File | Purpose |
|---|---|
| `app/robots.ts` | Generates `robots.txt` — allow public routes, disallow `/auth/` and `/api/` |
| `app/sitemap.ts` | Generates `sitemap.xml` — static routes + first page of bots/servers (revalidates hourly) |
| `app/manifest.ts` | Web app manifest for PWA install support |
| `app/opengraph-image.tsx` | Global OG image via `ImageResponse` (1200×630) |
| `app/bots/[id]/opengraph-image.tsx` | Per-bot OG image — fetches live bot data |
| `app/servers/[id]/opengraph-image.tsx` | Per-server OG image — fetches live server data |

Per-page metadata is set via `export const metadata` (static) or `export async function generateMetadata` (dynamic) in each `page.tsx`. The root layout sets the `title.template` so page titles automatically get `— Omniplex` appended.

---

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://spider.omniplex.gg` | Popplio API base URL |
| `NEXT_PUBLIC_CDN_URL` | `https://cdn.omniplex.gg` | Asset CDN base URL |
| `NEXT_PUBLIC_BASE_URL` | `http://localhost:3000` | Canonical site URL (robots.txt, sitemap, OG images, OAuth redirect URI) |

All `NEXT_PUBLIC_*` vars are inlined at `bun run build` time, not read at runtime — see the Deployment section.

---

## Running locally

```bash
bun dev            # start dev server on :3000
bun run build      # production build
bun run lint       # Biome lint + format check
bun run format     # Biome format (write)
bun run typecheck  # TypeScript checks (monorepo)
bun run test       # package tests (monorepo)
```

In the monorepo, run these from the repo root.

---

## Deployment

Omniplex and Popplio each deploy from the `Dockerfile` at their repo root. Omniplex takes the `NEXT_PUBLIC_*` values as build arguments. Popplio reads `config.yaml` from its working directory, so mount it at `/app/config.yaml`; the image also ships `/app/migrate`. Pushing a `v*` tag publishes each image to GHCR (`ghcr.io/plexioss/popplio`, `ghcr.io/plexioss/omniplex`) through the `Publish Docker Image` workflow; Omniplex's `NEXT_PUBLIC_*` build arguments come from repository Actions variables. See the README's "Deployment" section for the `NEXT_PUBLIC_*` build-time-vs-runtime env var gotcha before changing env config: those vars are baked in at `bun run build` time, not read at runtime, so they must be set before build, not just before start.

---

## Governance & community docs

`CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, and `.github/ISSUE_TEMPLATE/` exist at the repo root — read those before changing contribution flow, security-disclosure process, or issue templates rather than duplicating that content here. Licensed under AGPL-3.0-or-later (see `LICENSE`), matching the Popplio backend. The monorepo's published packages (everything under `packages/`) are MIT, each with its own `LICENSE` file (pkg.go.dev and crates.io read it from the package folder), so bots can depend on them; keep any new published package MIT too.

---

## What's built vs. what's next

**Do not treat this section as the feature list — it goes stale fast. `CHANGELOG.md` (in this repo and in `popplio/`) is the source of truth for what's actually shipped, kept current as work lands.** This section only tracks structural/architectural notes worth knowing before touching a given area, plus genuinely open decisions.

- **Admin panel** (`/admin`, `src/app/admin/`): built — Discord OAuth + mandatory TOTP MFA login, Bot Queue, entity Search, Staff Positions/Members management, an Arcadia-backed permission system. Talks to **Arcadia** (`arcadia/`), not Popplio directly, via a single-endpoint tagged-union RPC protocol (`src/lib/arcadia/client.ts`). `docs/admin-panel-plan.md` is a historical planning doc from before this was built — check the changelog and the actual code before trusting anything in it about current state.
- **Knowledge base** (`/kb`): built. Articles are `.md` files with YAML frontmatter under `src/content/kb/<category>/<slug>.md` (frontmatter: `title`, `description`, `order`), parsed at request time with `gray-matter` in `src/lib/kb/content.ts` and rendered through the existing sanitized `Markdown` pipeline — no MDX/component execution. Category metadata (title/description/order) lives in `src/lib/kb/categories.ts` since a category isn't itself an article. Routes: `/kb` (landing + client-side search via `KbSearch`), `/kb/[category]` (listing), `/kb/[category]/[slug]` (article, with a persistent `KbSidebar` nav). `/help` and `/help/[category]/[slug]` redirect permanently to `/kb` via `next.config.ts`. Content was ported from reedwhisker's `src/components/guide/articles/` tree, excluding everything under `legal/` (superseded by nodebyte.co.uk's legal pages) — do not port reedwhisker's toggle-sidebar `HelpCenter.tsx` (it violates the rules of hooks) or its other bespoke components. To add an article: drop a new `.md` file with frontmatter in the right category folder; to add a category, add an entry to `KB_CATEGORIES` and a matching directory.
- **Reviews, Packs (bot+server), server presence, "add a server"**: all built this cycle — see the changelog for exact scope. Server deletion goes through `DELETE /servers/{id}` (Popplio, `delete_servers` team permission), surfaced in the server's danger zone at `/dashboard/servers/{id}?section=danger`.
- **Open**: no staff moderation path exists yet for reviews (no force-delete RPC). Servers do go through review: they're created `pending` and appear in Arcadia's server queue alongside bots.
