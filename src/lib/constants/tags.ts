// Copyright (C) 2026 NodeByte LTD 

export const BOT_TAGS = [
  "Auto-Mod",
  "Economy",
  "Fun",
  "Games",
  "Leveling",
  "Logging",
  "Moderation",
  "Music",
  "Roleplay",
  "Social",
  "Utility",
  "Welcome",
];

export const SERVER_TAGS = [
  "Gaming",
  "Community",
  "Education",
  "Entertainment",
  "Art",
  "Music",
  "Technology",
  "Support",
  "Roleplay",
  "Social",
];

/** A closed vocabulary, unlike BOT_TAGS/SERVER_TAGS -- the backend
 * enforces this exact list too (add_theme's `oneof` validation), so
 * changing this without changing that leaves the two out of sync. */
export const THEME_CATEGORIES = [
  "Green",
  "Blue",
  "Purple",
  "Pink",
  "Red",
  "Orange",
  "Dark",
  "Light",
  "Gradient",
  "Aesthetic",
  "Minimal",
  "Vibrant",
];
