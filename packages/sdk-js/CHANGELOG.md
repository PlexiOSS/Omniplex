# Changelog

All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.2] - 2026-10-30

### Fixed

- `UserVote.valid_votes` entries are typed with the fields the API really
  sends, through the corrected `Vote` type in `@omniplex/api-types`.

- Trailing slashes are removed from `baseUrl` with a simple loop instead of
  a regular expression, which took quadratic time on a URL ending in many
  slashes.

## [0.1.1] - 2026-10-29

### Fixed

- The package's repository link points at `PlexiOSS/Omniplex`. 0.1.0
  linked to the wrong repository.

## [0.1.0] - 2026-10-29

### Added

- First release of the official JavaScript and TypeScript SDK.
- `Omniplex` client with `postBotStats`, `postServerStats` and
  `autoPostBotStats` for posting stats, `hasVoted`, `getBotVote`,
  `hasVotedForServer` and `getServerVote` for checking votes, and `getBot`,
  `getServer` and `getUser` for public data.
- Webhook verification for all three of Omniplex's signing methods
  (`hmac-sha256`, `splashtail` and `simple-auth`) with `verifyWebhook`,
  `verifyWebhookRequest` and `createWebhookHandler`, plus typed events.
- Retries for rate-limited requests (using `Retry-After`) and for failed
  `GET` requests, and an `OmniplexError` carrying the API's message.
- Licensed under MIT, unlike the AGPL-3.0 website, so bots and other
  projects can depend on it under any licence.
