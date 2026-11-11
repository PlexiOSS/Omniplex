# Changelog

All notable changes to the documentation site will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [1.0.2] - 2026-11-11

### Changed

- Authentication explains creating a token in the dashboard, keeping it safe
  and what to do if it leaks. Posting Bot Stats covers how often to post,
  posting `offline` on shutdown, and how status affects uptime. Webhooks
  covers setting one up in the dashboard and what happens when deliveries
  fail. These came from knowledge base articles that now redirect here.

## [1.0.1] - 2026-11-09

### Changed

- The API reference covers 30-day uptime, hidden stats and the new view and
  invite click endpoints.

## [1.0.0] - 2026-11-08

### Added

- **Listing a Server**, a guide to adding a server and everything you can
  set up afterward.
- **Posting Changelogs**: publishing release notes from code, for example
  from CI with a bot token.
- **Platform Stats**: the public `/list/stats` and `/list/stats/history`
  endpoints.
- Vote messages on the Infernoplex page, and monthly resets and Auto-vote on
  the Votes page.
- The API reference now covers server changelogs, vote messages, Auto-vote
  slots, booster perks, promo codes and stats history.
- An SDKs section with a guide for each official SDK: JavaScript and
  TypeScript, Python, Go and Rust.
- SDK examples for posting bot stats, in tabs for each language.
- A full webhook event reference, event filtering, and the steps for
  verifying `splashtail` deliveries by hand.
- API reference pages for changelogs, emojis, stickers, sounds, server
  templates, themes and linked roles, which the old reference was missing.

### Changed

- The API reference covers the latest API, including site preferences and
  the Page Style pass.
- The schema snapshot can be built from Popplio's source with
  `go run ./cmd/openapi`, so new endpoints can be documented before they're
  deployed. `bun run openapi` reads it with `OPENAPI_FILE`.
- Discord links point at the current invite.
- Moved into the Omniplex monorepo as `@omniplex/docs`, with its history.
  It's deployed from `apps/docs/Dockerfile` on Dokploy instead of the old
  systemd service.
- Upgraded to Fumadocs 16 on Next.js 16, React 19 and Tailwind CSS 4, the
  same versions as the website.
- The API reference is built from a committed `openapi.json` snapshot
  instead of the live API, so builds don't depend on the API being up. Its
  pages are created from the schema at build time by `fumadocs-openapi` 12,
  so there are no generated MDX files to keep in sync; `bun run openapi`
  only refreshes the snapshot.
- Upgraded to `fumadocs-core` and `fumadocs-ui` 16.17.9 and
  `fumadocs-openapi` 12.5.7, which fixes an open-proxy issue in the OpenAPI
  package's `createProxy()`. The docs never used it, so the site wasn't
  exposed.
- The Votes page is about checking votes and receiving vote webhooks. It
  explains that votes are cast from omniplex.gg with a Cloudflare Turnstile
  captcha, replacing the old proof-of-work captcha steps.
- Authentication covers which token to use, that user sessions only work on
  omniplex.gg, the HttpOnly session cookie and `POST /auth/logout`.

### Fixed

- Server and team tokens go in the `Authorization` header. The pages said to
  use `Server-Auth`, which the API never reads.
- The bot listing guide said bot settings could be changed with the bot's
  own token. Those endpoints need a user or team session.
- Two API reference pages got cleaner addresses, `api-tokens` and
  `platform-specific`, and the old addresses redirect to them.
