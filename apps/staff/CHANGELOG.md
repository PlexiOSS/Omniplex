# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-11-05

### Added

- The staff panel as its own app, moved out of the website's `/admin`. It
  runs on its own domain, so staff sessions never share an origin with the
  user-written HTML on the public site. Pages sit at the root (`/queue`
  instead of `/admin/queue`), and sign-in sends Discord back to
  `/auth/callback`. Links to listings and tickets open on the website.
- A strict Content Security Policy: scripts need the page's nonce, the
  browser can only connect to the panel itself, Popplio, Arcadia and the
  CDN, and no page can be framed or embed frames. Search engines are told
  not to index it.
- A slimmer header with a theme switch and a link back to Omniplex.
- An **Activity** page: everything that changed on the site, from API
  changes by members, owners and API tokens to staff panel actions,
  payments, refunds, Auto-vote and background task failures. Users, bots,
  servers and teams show by name, with the ID in the event's details.
  Filter by source, actor, target, action or failed requests, open an event
  to see its details, and load older events as you scroll. Needs the View
  Audit Logs permission. The old page is now called **RPC Logs**.
- A **Payments** page in the Shop section, for staff with the new View
  Payments permission. The Premium tab lists recent purchases with how much
  premium each added, the credits and promo code used and any refund or
  dispute, with links to Stripe. The Auto-vote tab lists every subscriber
  and what each of their listings is waiting for: a cooldown, the schedule,
  a skip, or the next run.

### Changed

- Tickets load through Arcadia with the staff session, so the panel no
  longer needs you to be signed in to the website as well. Opening a ticket
  still takes you to it on the website.
