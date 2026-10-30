// Copyright (C) 2026 NodeByte LTD

export interface Collection {
  slug: string;
  title: string;
  description: string;
  targetType: "bot" | "server";
  tag: string;
}

export const COLLECTIONS: Collection[] = [
  {
    slug: "best-music-bots",
    title: "Best Music Bots",
    description: "Top-voted bots for playing music in voice channels.",
    targetType: "bot",
    tag: "Music",
  },
  {
    slug: "best-moderation-bots",
    title: "Best Moderation Bots",
    description: "Top-voted bots for keeping a server in line.",
    targetType: "bot",
    tag: "Moderation",
  },
  {
    slug: "best-economy-bots",
    title: "Best Economy Bots",
    description: "Top-voted bots for virtual currency and gambling games.",
    targetType: "bot",
    tag: "Economy",
  },
  {
    slug: "best-utility-bots",
    title: "Best Utility Bots",
    description: "Top-voted bots for general-purpose server tooling.",
    targetType: "bot",
    tag: "Utility",
  },
  {
    slug: "best-fun-bots",
    title: "Best Fun Bots",
    description: "Top-voted bots for games, memes, and messing around.",
    targetType: "bot",
    tag: "Fun",
  },
  {
    slug: "best-leveling-bots",
    title: "Best Leveling Bots",
    description: "Top-voted bots for XP, ranks, and activity rewards.",
    targetType: "bot",
    tag: "Leveling",
  },
  {
    slug: "best-gaming-servers",
    title: "Best Gaming Servers",
    description: "Top-voted servers built around gaming communities.",
    targetType: "server",
    tag: "Gaming",
  },
  {
    slug: "best-community-servers",
    title: "Best Community Servers",
    description: "Top-voted servers focused on general community hangouts.",
    targetType: "server",
    tag: "Community",
  },
];
