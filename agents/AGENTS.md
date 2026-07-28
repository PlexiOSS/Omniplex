<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Omniplex — Agent & Contributor Guide

## Project overview

Omniplex is a Discord bot and server list built with **Next.js 16 App Router**, **Tailwind CSS v4**, and **TypeScript**. The backend API is called **Popplio**; the default base URL is set in `src/lib/api/config.ts` and overridable via `NEXT_PUBLIC_API_URL` (see env var table below — do not hardcode a hostname elsewhere, it will drift). This frontend is intentionally decoupled from the API — swapping the backend means changing `src/lib/api/` only.

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

## File structure

This tree is illustrative, not exhaustive — read the actual directory before assuming a file exists.

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
│   │   ├── Container.tsx, Header.tsx, Footer.tsx, ThemeToggle.tsx, ServiceUnavailable.tsx
│   ├── ui/                      # Primitive building blocks
│   │   ├── Avatar.tsx, Badge.tsx, Button.tsx, Input.tsx, Modal.tsx, Skeleton.tsx
│   │   ├── TagPicker.tsx, CustomizationPanel.tsx, BrandIcons.tsx, OmniplexLogo.tsx
│   ├── cards/
│   │   ├── BotCard.tsx, ServerCard.tsx, PackCard.tsx
│   ├── home/
│   │   ├── HomeTabs.tsx, StatsBar.tsx
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

- Session stored in `localStorage` under the key `wistala` as `{ token, user_id, expires_at }`
- `useAuth` hook reads/writes/clears the session; subscribe to it for reactive auth state
- Auth token is passed as `Authorization: User {token}` by the API client automatically
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

---

## Component conventions

- Server components by default — only add `"use client"` when the component needs hooks, event handlers, or browser APIs.
- Co-locate client-only sub-components with their parent page (e.g. `VoteButton.tsx` next to `page.tsx`).
- Props interfaces use plain TypeScript `interface`, defined at the top of the file.
- No default exports for UI components — use named exports.
- Pages use default exports (required by Next.js).

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
| `NEXT_PUBLIC_API_URL` | `https://spider-staging.omniplex.gg` | Popplio API base URL |
| `NEXT_PUBLIC_CDN_URL` | `https://cdn.omniplex.gg` | Asset CDN base URL |
| `NEXT_PUBLIC_BASE_URL` | `http://localhost:3000` | Canonical site URL (robots.txt, sitemap, OG images, OAuth redirect URI) |

All `NEXT_PUBLIC_*` vars are inlined at `bun run build` time, not read at runtime — see the Deployment section.

---

## Running locally

```bash
bun dev        # start dev server on :3000
bun build      # production build
bun lint       # Biome lint + format check
bun format     # Biome format (write)
```

---

## Deployment

Deployed via [Railpack](https://railpack.com) — config lives in `railpack.json` at the repo root (Bun auto-detected via `bun.lock`). See the README's "Deployment" section for the `NEXT_PUBLIC_*` build-time-vs-runtime env var gotcha before changing env config: those vars are baked in at `bun run build` time, not read at runtime, so they must be set before build, not just before start.

---

## Governance & community docs

`CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, and `.github/ISSUE_TEMPLATE/` exist at the repo root — read those before changing contribution flow, security-disclosure process, or issue templates rather than duplicating that content here. Licensed under AGPL-3.0-or-later (see `LICENSE`), matching the Popplio backend.

---

## Planned / in-progress work

- **Admin panel**: planning-stage only — see `docs/admin-panel-plan.md`. It documents the existing Popplio `apps` review-queue system and flags an open question around the separate staff-panel auth mechanism (`EnsurePanelAuth`, not the normal Discord OAuth session) that blocks implementation.
- **Knowledge base** (`/kb`): built. Articles are `.md` files with YAML frontmatter under `src/content/kb/<category>/<slug>.md` (frontmatter: `title`, `description`, `order`), parsed at request time with `gray-matter` in `src/lib/kb/content.ts` and rendered through the existing sanitized `Markdown` pipeline — no MDX/component execution. Category metadata (title/description/order) lives in `src/lib/kb/categories.ts` since a category isn't itself an article. Routes: `/kb` (landing + client-side search via `KbSearch`), `/kb/[category]` (listing), `/kb/[category]/[slug]` (article, with a persistent `KbSidebar` nav). `/help` and `/help/[category]/[slug]` redirect permanently to `/kb` via `next.config.ts`. Content was ported from reedwhisker's `src/components/guide/articles/` tree, excluding everything under `legal/` (superseded by nodebyte.co.uk's legal pages) — do not port reedwhisker's toggle-sidebar `HelpCenter.tsx` (it violates the rules of hooks) or its other bespoke components. A handful of reedwhisker articles are live/interactive (fetch from Popplio/CDN, render permission pickers, live stats, etc.) rather than static content — those were intentionally left out and still need real feature work, not a content port, if they're wanted later. To add an article: drop a new `.md` file with frontmatter in the right category folder; to add a category, add an entry to `KB_CATEGORIES` and a matching directory.
