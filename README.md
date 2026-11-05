# Omniplex

Omniplex is a Discord bot and server listing platform. This repository is a monorepo containing the website, the staff panel, the developer documentation and the official API SDKs. The website is built with Next.js 16, Tailwind CSS v4, and TypeScript. The API backend, Popplio, lives in a separate repository, as does Arcadia, the staff panel API that powers the staff panel in `apps/staff`.

* See [apps/web/CHANGELOG.md](apps/web/CHANGELOG.md) for what's shipped on the website, [apps/docs/CHANGELOG.md](apps/docs/CHANGELOG.md) for the documentation, and each package's own `CHANGELOG.md` for the SDKs.
* Production runs at [omniplex.gg](https://omniplex.gg), and the developer docs at [docs.omniplex.gg](https://docs.omniplex.gg).

---

## Tech stack

| Layer | Tool |
|---|---|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS v4 |
| Language | TypeScript |
| Data fetching | SWR (client), native `fetch` (server components) |
| Linting and formatting | Biome (TypeScript), Ruff (Python), gofmt and go vet (Go), rustfmt and Clippy (Rust) |
| Package manager | Bun workspaces |
| Monorepo tasks | Turborepo |

---

## Getting started

Install dependencies and start the website's dev server from the repo root:

```bash
bun install
bun dev
```

The app runs at [http://localhost:3000](http://localhost:3000). Run `bun run dev:docs` for the documentation site at [http://localhost:3001](http://localhost:3001).

Other scripts, also run from the root, go through Turborepo and cover every package:

```bash
bun run build      # build everything
bun run lint       # Biome lint and format check
bun run typecheck  # TypeScript checks
bun run test       # package tests
bun run format     # Biome format, writes changes
```

To run one package's task, use `bunx turbo run <task> --filter=<package name>`, for example `--filter=@omniplex/sdk`. To run the built website locally, run `bun run start` in `apps/web`.

---

## Configuration

The website talks to Popplio through the API client in `packages/core/api/`. The staff panel (`apps/staff`) also talks to Arcadia, the staff panel API (`apps/staff/src/lib/arcadia/`). These environment variables control the website:

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_BASE_URL` | `http://localhost:3000` | Canonical URL of this instance used in metadata, sitemaps, and as the OAuth redirect URI. Must exactly match what's registered in the Discord Developer Portal and in Popplio/Arcadia's own redirect allowlists. |
| `NEXT_PUBLIC_API_URL` | `https://spider.omniplex.gg` | Popplio API base URL |
| `NEXT_PUBLIC_CDN_URL` | `https://cdn.omniplex.gg` | Asset CDN base URL |
| `NEXT_PUBLIC_STAFF_URL` | `https://panel.omniplex.gg` | Where the staff panel is deployed. The account menu links there, and `/admin` redirects there |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | (none) | Cloudflare Turnstile site key for vote captchas. Its secret key goes in Popplio's `captcha.turnstile_secret`. Without it, votes on listings that use captchas can't be cast |
| `SHORT_LINK_DOMAINS` | (none) | Comma-separated short-link domains, such as `botlist.site`. `<domain>/<id or vanity>` redirects to that listing, other paths redirect to the same path on `NEXT_PUBLIC_BASE_URL`, and the first domain is used by the "Short link" button. Read at runtime, so adding a domain needs a restart, not a rebuild. Point the domain's DNS at this deployment and add it to your host first. |

The staff panel's settings, including `NEXT_PUBLIC_ARCADIA_URL`, `NEXT_PUBLIC_ARCADIA_PANEL_SCOPE` and `NEXT_PUBLIC_SITE_URL`, are listed in `apps/staff/.env.template`.

Copy `apps/web/.env.template` to `apps/web/.env.local` (or `apps/staff/.env.template` to `apps/staff/.env.local`) to override any of these for local development. None are required to run the app against staging; the defaults point there already.

## Deployment

Build and run the `Dockerfile` from the repo root. The build context is the whole repo, and the image runs the website from `apps/web`:

```bash
docker build -t omniplex   --build-arg NEXT_PUBLIC_BASE_URL=https://omniplex.gg   --build-arg NEXT_PUBLIC_API_URL=https://spider.omniplex.gg .
docker run -p 3000:3000 -e SHORT_LINK_DOMAINS=botlist.site omniplex
```

The `NEXT_PUBLIC_*` variables are inlined when the site is built, so pass them with `--build-arg`. Setting them on the running container does nothing, and changing one means rebuilding the image. Any you leave out fall back to the defaults above. Runtime settings like `SHORT_LINK_DOMAINS` and the `S3_*` values go on the container.

The staff panel builds from `apps/staff/Dockerfile`, also with the repo root as context, and listens on port 3002. Deploy it on its own domain (such as `panel.omniplex.gg`), never under the website's domain: keeping it on a separate origin is the point of splitting it out. Partner logo uploads need the same `S3_*` values as the website on its container. Add `<staff URL>/auth/callback` to Arcadia's `arcadia.panel.redirect_url` list and to the Discord application's redirects.

Tagged releases are also published to `ghcr.io/plexioss/omniplex` by the `Publish Docker Image` workflow, built with the `NEXT_PUBLIC_*` values set as repository Actions variables.

---

## Project structure

```
apps/
├── docs/                docs.omniplex.gg (Fumadocs), @omniplex/docs
├── staff/               the staff panel (Next.js), @omniplex/staff
└── web/                 omniplex.gg (Next.js), @omniplex/web
    └── src/
        ├── app/         App Router pages, layouts, and route handlers
        ├── components/  UI primitives, cards, layout, and feature components
        ├── hooks/       Client-side data and state hooks
        └── lib/         API client and shared utilities
packages/
├── api-types/           @omniplex/api-types: TypeScript types for the API, used by the website and the JS SDK
├── core/                @omniplex/core: the API client and helpers shared by the website and staff panel (private)
├── sdk-go/              github.com/PlexiOSS/Omniplex/packages/sdk-go: the Go SDK (Go module proxy)
├── sdk-js/              @omniplex/sdk: the JavaScript and TypeScript SDK (npm)
├── sdk-python/          omniplex-sdk: the Python SDK (PyPI)
├── sdk-rust/            omniplex: the Rust SDK (crates.io)
└── ui/                  @omniplex/ui: React components and theme shared by the website and staff panel (private)
```

See `AGENTS.md` at the root of the wider plexicore workspace (outside this repo) for a full breakdown of the codebase layout, API layer conventions, and styling rules.

## Releasing

The website is released by tagging `v<version>`, as before. Each package is released with its own tag, such as `sdk-js@v0.1.0`, `api-types@v0.1.0`, `sdk-python@v0.1.0` or `sdk-rust@v0.1.0`, which publishes it to npm, PyPI or crates.io through trusted publishing. The Go SDK is released by tagging `packages/sdk-go/v0.1.0`, the form Go requires for a module in a subfolder.

---

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request, and note that participation in this project is governed by our [Code of Conduct](CODE_OF_CONDUCT.md).

---

## Security

If you find a security vulnerability, please do not open a public issue. See [SECURITY.md](SECURITY.md) for how to report it.

---

## License

The website is licensed under AGPL-3.0-or-later (see [LICENSE](LICENSE)). The packages in `packages/` (`@omniplex/api-types`, `@omniplex/sdk`, `omniplex-sdk`, the Go SDK and the `omniplex` crate) are licensed under MIT, so they can be used in projects under any licence.

Omniplex is developed by [NodeByte LTD](https://nodebyte.co.uk). Not affiliated with Discord.
