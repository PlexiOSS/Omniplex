# Changelog

All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Security

- `Client.Do` refuses a path that doesn't start with a single `/`, or that
  would point the request at a different host, before sending anything. A
  path such as `@attacker.example/` used to turn the base URL into
  `https://api.omniplex.gg@attacker.example/` and send your token there.
- Printing a `*Client` with `fmt` (`%v`, `%+v` or `%#v`) shows the token as
  `[redacted]` instead of the token itself, so logging the client can't leak
  it.

## [0.1.0] - 2026-10-30

### Added

- First release of the official Go SDK.
- Posting bot and server stats, once or automatically on an interval.
- Checking votes for bots and servers, and reading bots, servers and users.
- Verifying webhooks for all three of Omniplex's signing methods
  (`hmac-sha256`, `splashtail` and `simple-auth`), with typed events.
- Retries for rate-limited requests (using `Retry-After`) and for failed
  `GET` requests.
- Licensed under MIT.
