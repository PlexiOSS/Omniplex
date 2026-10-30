# Omniplex Documentation

The developer documentation at [docs.omniplex.gg](https://docs.omniplex.gg), built with [Fumadocs](https://fumadocs.dev) on Next.js. It lives in the Omniplex monorepo as `@omniplex/docs`.

## Running it

From the repo root:

```bash
bun install
bun run dev:docs
```

Open [http://localhost:3001](http://localhost:3001). The website runs on port 3000, so both can run at once.

## Content

Pages are MDX files under `content/docs/`. Each folder has a `meta.json` that sets its title and page order. The top-level folders (`developer`, `sdks`, `guides`, `api-reference`) are the sections in the sidebar.

## API reference

`content/docs/api-reference/` is generated from Popplio's OpenAPI schema. Don't edit those pages by hand. To update them:

```bash
cd apps/docs
bun run openapi
```

This downloads the schema from `https://api.omniplex.gg/openapi` (set `OPENAPI_URL` to use another instance), saves it as `openapi.json`, and regenerates the pages. Commit both, so the docs always build from a known schema instead of whatever the live API returns at build time.

The script renames schemas whose names contain `/`, such as `types.ItemList[popplio/types.ShopCoupon]`. Popplio's generator produces those for Go generic types, and they aren't valid in a JSON reference.

If the schema gains or loses a tag, update the page order in `content/docs/api-reference/meta.json`.

## Deployment

Deployed on Dokploy from `apps/docs/Dockerfile`, with the **repo root** as the build context so it can use the monorepo's lockfile. The image serves on port 3001 as the unprivileged `node` user. `NEXT_PUBLIC_BASE_URL` (default `https://docs.omniplex.gg`) is a build argument.

When you add a workspace package, add its `package.json` to the `manifests` stage of this Dockerfile and the website's, or `bun install --frozen-lockfile` fails.
