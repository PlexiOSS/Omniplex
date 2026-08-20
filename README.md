# Omniplex Documentation

The documentation site for Omniplex, built with [Fumadocs](https://fumadocs.vercel.app) on Next.js. Runs in production at [docs.omniplex.gg](https://docs.omniplex.gg).

## Getting started

```bash
bun install
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to see it.

Other scripts:

```bash
bun run build   # production build
bun run start   # run a production build locally
```

`postinstall` runs `fumadocs-mdx`, which generates the content index from `content/` — this happens automatically on `bun install`.

## Deployment

Runs self-hosted on the same server as the main site and status page, behind nginx with a Cloudflare Origin CA certificate, as its own dedicated low-privilege systemd account (`docs`, `nologin` shell — every command against it goes through `sudo -u docs ...`, not `-i`, since `-i` tries to invoke the account's shell and fails against `nologin`).

```bash
sudo -u docs scripts/deploy.sh
```

The script deliberately doesn't restart the service itself, since that account has no `sudo` rights — apply the build manually (or via CI):

```bash
sudo systemctl restart omniplex-docs
```

Repo access on the server is via a read-only SSH deploy key on this repo, not a personal GitHub credential.

## Learn more

- [Next.js Documentation](https://nextjs.org/docs)
- [Fumadocs](https://fumadocs.vercel.app)
