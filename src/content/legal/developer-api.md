---
title: Developer & API Policy
description: Rules for using the Omniplex API directly, beyond just the website.
order: 5
lastUpdated: "2026-09-02"
---

This applies if you're calling the Omniplex API directly, whether that's a bot posting its own stats, a script pulling listing data, or anything else built against it. It sits alongside the [Terms of Service](/legal/terms), which still applies to your account and any listings you own.

## Authentication & key security

API tokens are tied to your account (or your bot's account, for bot-stats endpoints). You're responsible for everything done with a token issued to you. Keep it out of client-side code, public repos, and anywhere else it could leak. If a token is compromised, regenerate it and, if you suspect it was misused, [open a support ticket](/tickets).

## Acceptable use

- Use the API to build real integrations: a bot posting its own guild count, a dashboard for a server you run, a tool that looks up a handful of listings, that kind of thing.
- Don't scrape the full directory to build a competing listing site, or resell raw API data as a standalone product. The data is for building something with an individual bot/server/pack, not for republishing the catalog itself.
- Respect the documented [rate limits](https://docs.omniplex.gg/docs/api-reference/rate-limits). Spreading requests across multiple tokens or IPs specifically to get around them is treated as abuse, not clever engineering.
- [Webhooks](https://docs.omniplex.gg/docs/api-reference/webhooks) are for receiving events about your own listings. Pointing one at an endpoint designed to cause harm, or using webhook delivery to attack a third party, gets the webhook disabled and can affect your account.

## When we throttle or revoke access

Exceeding rate limits gets you temporarily throttled first, in most cases. Repeated abuse, a security risk, or a breach of this policy or the [Terms of Service](/legal/terms) can get a token revoked outright, without warning for anything severe (credential leaks, active abuse, attacks routed through our API).

## The API can change

Endpoints, response shapes, and rate limits can change as Omniplex changes. We'll call out breaking changes in the [Changelog](/changelog) when we can, but same as the rest of the site the API is provided as-is, without a guarantee that any given version stays stable forever.

## Changes to this policy

We may update this policy as the API changes. Meaningful changes will update the date at the top of this page.

## Contact

Technical questions belong in the [API docs](https://docs.omniplex.gg). Account-specific access issues, like a revoked token you think was a mistake, go through [Support Tickets](/tickets).
