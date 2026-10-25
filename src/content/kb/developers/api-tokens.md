---
title: API Tokens
description: Create a token so your bot, server or script can use the Omniplex API, and keep it safe.
order: 4
---

An API token lets code act on behalf of a bot, a server or your own account without signing in. Your bot needs one to [post stats](/kb/developers/posting-stats), for example.

## Creating a token

1. Open your [dashboard](/dashboard). For a bot or server token, find the listing on the Bots or Servers tab and click its **Tokens** button. For a personal token that acts as you, open **Sessions**, which also lists the devices you're signed in on.
2. Give the token a name (something like "Production bot") and pick how long it lasts: 1 hour, 1 day, 7 days, 30 days or 1 year.
3. Optionally, tick **Restrict permissions** and choose only the permissions the token needs. A restricted token can never do more than you can yourself.
4. Create it and **copy the token straight away**. It's only shown once.

Every token is listed with its name, expiry and permissions, so you can tell them apart later.

## Using a token

Send it in the `Authorization` header of your requests. You can send the token on its own, or with a prefix matching what it was created for, such as `Bot <token>` for a bot token. A token used against something it wasn't created for is rejected.

## Keeping it safe

- Treat a token like a password. Don't commit it to a public repository, paste it in Discord, or put it in client-side code.
- Store it in an environment variable or your host's secret storage.
- Use **Restrict permissions** for anything that only needs to do one job.
- Prefer an expiry over a token that lasts forever, and create a new one before the old one expires.

## If a token leaks

Open **Tokens** for the same bot or server and **revoke** it. It stops working immediately. Then create a new one and update your bot. If you think someone used a leaked token to change your listing, [open a support ticket](/tickets).

For authentication details across the whole API, see [Authentication](https://docs.omniplex.gg/docs/developer/authentication) in the developer docs.
