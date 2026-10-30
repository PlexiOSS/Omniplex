# Changelog

All notable changes to the documentation site will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- An SDKs section with a guide for each official SDK: JavaScript and
  TypeScript, Python, Go and Rust.
- SDK examples for posting bot stats, in tabs for each language.
- A full webhook event reference, event filtering, and the steps for
  verifying `splashtail` deliveries by hand.
- API reference pages for changelogs, emojis, stickers, sounds, server
  templates, themes and linked roles, which the old reference was missing.

### Changed

- Moved into the Omniplex monorepo as `@omniplex/docs`, with its history.
  It's deployed from `apps/docs/Dockerfile` on Dokploy instead of the old
  systemd service.
- Upgraded to Fumadocs 16 on Next.js 16, React 19 and Tailwind CSS 4, the
  same versions as the website.
- The API reference is generated from a committed `openapi.json` snapshot
  instead of the live API, so builds don't depend on the API being up.
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
