# Changelog

All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `PromoCodePreview` and `PromoCodeProduct` for
  `POST /users/{id}/promo-codes/check`, and `promo_code` on
  `CreatePerkPayload`.

## [0.1.2] - 2026-10-30

### Added

- `ChangelogEntry.package`: the package within the project an entry is for,
  such as `"sdk-js"`, or `null` for the project itself.

### Fixed

- `Vote`, the type of `UserVote.valid_votes`, now matches what the API
  sends: `author`, `upvote`, `void`, `void_reason`, `voided_at`,
  `vote_num`, `credit_redeem`, `immutable`, `auto` and the target. It used
  to describe `user_id` and `created_at`, and `user_id` never existed.

## [0.1.1] - 2026-10-29

### Fixed

- The package's repository link points at `PlexiOSS/Omniplex`. 0.1.0
  linked to the wrong repository. Added `bugs` and `keywords`, so the
  npm page links to the issue tracker and the package shows up in search.

## [0.1.0] - 2026-10-29

### Added

- First release: the API types used by omniplex.gg, moved out of the
  website into their own package.
- Licensed under MIT, unlike the AGPL-3.0 website, so bots and other
  projects can depend on it under any licence.
