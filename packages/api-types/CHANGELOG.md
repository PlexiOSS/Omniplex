# Changelog

All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.5.0] - 2026-11-09

### Added

- `hidden_stats` on bots and servers, and on their settings updates.
- `uptime_percent` and `uptime_checks` on `Bot`.

## [0.4.0] - 2026-11-08

### Added

- `SitePrefs`.
- `unlocked_until` on `ManagedPageStyle`.
- `flag` on `AppQuestion`.
- `AppQuestionType` and `AppQuestionCondition`, and `type`, `options`,
  `optional`, `min_length`, `max_length` and `show_if` on `AppQuestion`.
- `PageStyle`, `ManagedPageStyle`, `PageStyleUpdate` and `PageGradient`.
- `StatsHistory` and `StatsHistoryMonth`.

## [0.3.0] - 2026-11-07

### Added

- `BoosterPerks`, `BoosterPerkTarget`, `AutoVotePricing` (as `auto_vote` on
  `PlanList`) and `booster_slots` on `AutoVoteStatus`.
- `extra_slots`, `max_extra_slots`, `slot_price_cents` and
  `billing_interval` on `AutoVoteStatus`.
- `ServerVoteChannel` and `ServerVoteChannelOption`.
- `ServerChangelog`, `ServerChangelogList`, `ServerChangelogFeedEntry` and
  `ServerChangelogFeedFilters`.
- `AutoVoteNotify`, `notify` and `yearly_price_cents` on `AutoVoteStatus`,
  and `paused` on Auto-vote targets.

## [0.2.0] - 2026-11-07

### Added

- `help_url` and `help_label` on `AppPosition`.
- `"staff"` in `AlertCategory`, for notifications about a staff member's
  leave and disciplinaries.

## [0.1.3] - 2026-11-04

### Added

- `PromoCodePreview` and `PromoCodeProduct` for
  `POST /users/{id}/promo-codes/check`, and `promo_code` on
  `CreatePerkPayload`.
- `cooldown_until` and `in_schedule` on `AutoVoteTarget`.

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
