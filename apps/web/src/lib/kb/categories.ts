// Copyright (C) 2026 NodeByte LTD

export interface KbCategoryMeta {
  slug: string;
  title: string;
  description: string;
  order: number;
}

export const KB_CATEGORIES: KbCategoryMeta[] = [
  {
    slug: "basics",
    title: "Basics",
    description:
      "Getting started, and rules and policies for our Official Discord Server(s) and community.",
    order: 1,
  },
  {
    slug: "bots",
    title: "Bots",
    description:
      "Rules and resources for Discord bots listed on Omniplex, and the pages that represent them.",
    order: 2,
  },
  {
    slug: "servers",
    title: "Servers",
    description: "Rules and resources for Discord servers listed on Omniplex.",
    order: 3,
  },
  {
    slug: "listings",
    title: "Managing Listings",
    description:
      "How-tos for running a listing: commands, changelog updates, teams, vanity URLs, banners, formatting with Markdown and HTML, styling your page, and listing a server.",
    order: 4,
  },
  {
    slug: "developers",
    title: "Developers",
    description:
      "Posting stats, bot status and uptime, vote webhooks, API tokens, and embeddable widgets.",
    order: 5,
  },
  {
    slug: "packs",
    title: "Packs",
    description:
      "Rules and resources for packs: curated collections of bots or servers, and sets of emojis, stickers or sounds.",
    order: 6,
  },
  {
    slug: "voting",
    title: "Voting & Reviews",
    description:
      "How voting and reviews work on Omniplex, including cooldowns, the monthly reset, the leaderboard, and abuse policy.",
    order: 7,
  },
  {
    slug: "programs",
    title: "Programs",
    description:
      "Information about Omniplex's staff, dev team, certification, and partnership programs.",
    order: 8,
  },
  {
    slug: "account",
    title: "Account",
    description:
      "Alerts, push notifications, reminders, and your account data.",
    order: 9,
  },
  {
    slug: "premium",
    title: "Premium & Shop",
    description:
      "Buying premium directly, and spending a bot's earned vote credits in the shop.",
    order: 10,
  },
  {
    slug: "support",
    title: "Support",
    description: "Getting help from staff when something needs a human.",
    order: 11,
  },
  {
    slug: "staff",
    title: "Staff",
    description:
      "How the staff team is structured, what each position can do, and how moderation actually works day to day.",
    order: 12,
  },
];
