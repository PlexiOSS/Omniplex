<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Omniplex — Agent & Contributor Guide

## Project overview

Omniplex is a Discord bot and server list built with **Next.js 16 App Router**, **Tailwind CSS v4**, and **TypeScript**. The backend API is called **Popplio** and lives at `https://spider.omniplex.gg`. This frontend is intentionally decoupled from the API — swapping the backend means changing `src/lib/api/` only.

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

```
src/
├── app/                        # App Router pages & layouts
│   ├── layout.tsx              # Root layout — ThemeProvider, Header, Footer
│   ├── page.tsx                # Home page (server component)
│   ├── not-found.tsx           # Global 404
│   ├── error.tsx               # Global error boundary (client component)
│   ├── bots/
│   │   ├── page.tsx            # All bots list (client, SWR-paginated)
│   │   └── [id]/
│   │       ├── page.tsx        # Bot detail (server component)
│   │       ├── VoteButton.tsx  # Vote action (client component)
│   │       └── not-found.tsx
│   ├── servers/
│   │   ├── page.tsx
│   │   └── [id]/
│   │       ├── page.tsx
│   │       └── ServerVoteButton.tsx
│   ├── search/
│   │   └── page.tsx            # Interactive search (client component)
│   ├── user/
│   │   └── [id]/
│   │       └── page.tsx        # User profile (server component)
│   ├── robots.ts               # robots.txt — crawl rules
│   ├── sitemap.ts              # sitemap.xml — dynamic, fetches bots/servers (revalidates hourly)
│   ├── manifest.ts             # Web app manifest (PWA)
│   ├── opengraph-image.tsx     # Global OG image via ImageResponse
│   ├── error.tsx               # Global error boundary — API errors → ServiceUnavailable
│   ├── not-found.tsx           # Global 404
│   ├── bots/
│   │   ├── error.tsx           # Bots-section error boundary
│   │   └── [id]/
│   │       └── opengraph-image.tsx  # Per-bot OG image (server-fetched)
│   └── servers/
│       ├── error.tsx           # Servers-section error boundary
│       └── [id]/
│           └── opengraph-image.tsx  # Per-server OG image
│   └── auth/
│       ├── login/page.tsx      # Discord OAuth entry point
│       └── callback/page.tsx   # OAuth callback handler (client component)
│
├── components/
│   ├── providers/
│   │   └── ThemeProvider.tsx   # Wraps next-themes
│   ├── layout/
│   │   ├── Container.tsx       # Max-width wrapper
│   │   ├── Header.tsx          # Sticky nav (client — uses useAuth)
│   │   ├── Footer.tsx          # Static footer
│   │   ├── ThemeToggle.tsx     # Light/dark switcher
│   │   └── ServiceUnavailable.tsx  # Full or inline "we'll be right back" UI
│   ├── ui/                     # Primitive, unstyled-in-spirit building blocks
│   │   ├── Avatar.tsx
│   │   ├── Badge.tsx
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── OmniplexLogo.tsx    # Inline SVG logo — currentColor for theme awareness
│   │   └── Skeleton.tsx        # Loading placeholders incl. BotCardSkeleton
│   ├── cards/
│   │   ├── BotCard.tsx         # Grid card for IndexBot
│   │   └── ServerCard.tsx      # Grid card for IndexServer
│   └── search/
│       ├── SearchBar.tsx       # Reusable search input (navigate or callback)
│       └── Pagination.tsx      # Page controls
│
├── hooks/
│   ├── useAuth.ts              # Read/write session from localStorage
│   ├── useBots.ts              # SWR wrappers for bot API calls
│   ├── useSearch.ts            # Search state + SWR trigger
│   └── useVote.ts              # Vote submission with loading/error state
│
└── lib/
    ├── api/
    │   ├── config.ts           # API_URL, CDN_URL — change these to swap backends
    │   ├── types.ts            # All TypeScript types for API responses
    │   ├── client.ts           # Base fetch wrapper (client.get/post/patch/delete)
    │   ├── index.ts            # Re-exports: `bots`, `servers`, `search`, `users`, `auth`
    │   └── resources/
    │       ├── bots.ts
    │       ├── servers.ts
    │       ├── search.ts
    │       ├── users.ts
    │       └── auth.ts
    └── utils/
        ├── format.ts           # formatCount, formatRelativeTime, formatCountdown, truncate
        ├── assets.ts           # CDN URL builders, botUrl, serverUrl
        ├── auth.ts             # localStorage session helpers (getSession, saveSession, clearSession)
        └── errors.ts           # isApiUnavailable (server components), isBoundaryApiError (error.tsx)
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
- OAuth flow: `/auth/login` → Discord → `/auth/callback?code=...` → `auth.callback(code)` → `login(session)`

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
| `NEXT_PUBLIC_API_URL` | `https://spider.omniplex.gg` | Popplio API base URL |
| `NEXT_PUBLIC_CDN_URL` | `https://cdn.omniplex.gg` | Asset CDN base URL |
| `NEXT_PUBLIC_AUTH_REDIRECT` | `http://localhost:3000/auth/callback` | OAuth callback URL |
| `NEXT_PUBLIC_SITE_URL` | `https://omniplex.gg` | Canonical site URL (used in robots.txt, sitemap) |

---

## Running locally

```bash
bun dev        # start dev server on :3000
bun build      # production build
bun lint       # Biome lint + format check
bun format     # Biome format (write)
```
