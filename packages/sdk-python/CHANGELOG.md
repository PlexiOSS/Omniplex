# Changelog

All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Security

- `request()` on both clients refuses a path that doesn't start with a
  single `/`, or that would point the request at a different host, before
  sending anything. A path such as `@attacker.example/` used to turn the
  base URL into `https://api.omniplex.gg@attacker.example/` and send your
  token there.

## [0.1.0] - 2026-10-29

### Added

- First release of the official Python SDK, published as `omniplex-sdk`
  and imported as `omniplex`.
- Sync `Omniplex` and async `AsyncOmniplex` clients with
  `post_bot_stats`, `post_server_stats`, `has_voted`, `get_bot_vote`,
  `has_voted_for_server`, `get_server_vote`, `get_bot`, `get_server` and
  `get_user`, plus `AsyncOmniplex.auto_post_bot_stats` for posting on an
  interval.
- `verify_webhook` for all three of Omniplex's signing methods
  (`hmac-sha256`, `splashtail` and `simple-auth`), with `TypedDict`s for
  each event.
- Retries for rate-limited requests (using `Retry-After`) and for failed
  `GET` requests, and an `OmniplexError` carrying the API's message.
- Licensed under MIT, unlike the AGPL-3.0 website, so bots and other
  projects can depend on it under any licence.
