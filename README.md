# Omniplex

Omniplex is a Discord bot and server listing platform. This repository contains the frontend, built with Next.js 16, Tailwind CSS v4, and TypeScript. The API backend, Popplio, lives in a separate repository.

Production runs at [omniplex.gg](https://omniplex.gg), with [beta.omniplex.gg](https://beta.omniplex.gg) and [reedwhisker.omniplex.gg](https://reedwhisker.omniplex.gg) used for staged rollouts.

## Tech stack

| Layer | Tool |
|---|---|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS v4 |
| Language | TypeScript |
| Data fetching | SWR (client), native `fetch` (server components) |
| Linting and formatting | Biome |
| Package manager | Bun |

## Getting started

Install dependencies and start the dev server:

```bash
bun install
bun dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

Other scripts:

```bash
bun run build   # production build
bun run start   # run a production build locally
bun run lint    # Biome lint and format check
bun run format  # Biome format, writes changes
```

## Configuration

The frontend is decoupled from the backend through `src/lib/api/`. These environment variables control it:

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://spider-staging.omniplex.gg` | Popplio API base URL |
| `NEXT_PUBLIC_CDN_URL` | `https://cdn.omniplex.gg` | Asset CDN base URL |
| `NEXT_PUBLIC_SITE_URL` | `https://omniplex.gg` | Canonical site URL, used in metadata and sitemaps |
| `NEXT_PUBLIC_BASE_URL` | `http://localhost:3000` | Base URL for the running instance |

Set these in a `.env.local` file for local development. None are required to run the app against staging.

## Deployment

The app deploys via [Railpack](https://railpack.com) (config in `railpack.json`), which detects Bun from `bun.lock` and runs `bun run build` followed by `bun run start`.

Because the `NEXT_PUBLIC_*` variables above are inlined into the client bundle at build time, they must be set on the hosting platform *before* the build runs, not just at runtime. Setting them as runtime-only environment variables will silently bake in the defaults instead.

## Project structure

See [AGENTS.md](AGENTS.md) for a full breakdown of the codebase layout, API layer conventions, and styling rules. In short:

```
src/
├── app/          App Router pages, layouts, and route handlers
├── components/   UI primitives, cards, layout, and feature components
├── hooks/        Client-side data and state hooks
└── lib/          API client, types, and shared utilities
```

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request, and note that participation in this project is governed by our [Code of Conduct](CODE_OF_CONDUCT.md).

## Security

If you find a security vulnerability, please do not open a public issue. See [SECURITY.md](SECURITY.md) for how to report it.

## License

Omniplex is developed by [NodeByte LTD](https://nodebyte.co.uk). Not affiliated with Discord.
