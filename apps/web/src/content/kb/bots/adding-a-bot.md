---
title: Adding a Bot
description: A step-by-step guide to submitting your Discord bot to Omniplex.
order: 4
---

Adding a bot takes a few minutes. Have your bot's application ID and invite link ready, and read the [Bot Rules](/kb/bots/rules) and [Page Rules](/kb/bots/page-rules) first, since reviewers check every submission against them.

## Before you start

- **Your bot's application ID.** Find it in the [Discord Developer Portal](https://discord.com/developers/applications) under your application's **General Information**.
- **Public Bot turned on.** In the Developer Portal, under **Bot**, make sure **Public Bot** is enabled. Omniplex can't list a bot that only you can invite.
- **An invite link without Administrator.** Request only the permissions your commands need. Submissions whose invite asks for Administrator are rejected automatically. The [permission calculator](https://noadmin.info/calculator) helps you build a clean link.
- **Your bot online.** Reviewers need to try your commands.

## Step 1: Find your bot

Go to [Add a Bot](/bots/add) and paste the application ID, then choose **Look up bot**. Omniplex fetches its name, avatar and server count from Discord.

If the lookup asks for a **fallback bot ID**, enter your bot's user ID. It's usually the same as the application ID.

## Step 2: Confirm

Check that the name and avatar are right, then choose **Looks right, continue**. If you picked the wrong bot, choose **Change**.

## Step 3: Fill in the details

- **Short description** (30 to 191 characters): one or two sentences shown on cards and in search.
- **Invite URL**: your bot's OAuth2 invite link. The form warns you if it requests Administrator.
- **Prefix** and **Library**: use `/` as the prefix if your bot only has slash commands.
- **Tags** (1 to 5): pick the ones that describe what your bot does. Accurate tags help people find it.
- **Long description** (at least 500 characters): your bot's page. See [Writing a Great Bot Page](/kb/bots/writing-a-great-page).
- **Extra links**: a support server, website or source code. See [Extra Links](/kb/bots/extra-links).
- **Team**: who owns the listing. If you don't pick one, a team is created for you. See [Teams](/kb/listings/teams).

Your answers are saved in your browser as you type, so you can come back to the form later.

When everything looks right, choose **Submit for review**.

## What happens next

Your bot joins the review queue, a reviewer tests it, and you're notified when it's approved, or told why if it's denied. See [Getting Your Bot Approved](/kb/bots/getting-approved) for what reviewers look for.

Joining the [Omniplex Discord server](/about) isn't required to list a bot, but it's the fastest way to hear from reviewers if they have a question.
