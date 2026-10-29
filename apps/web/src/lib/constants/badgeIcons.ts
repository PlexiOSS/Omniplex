// Copyright (C) 2026 NodeByte LTD 

import {
  Award,
  Bug,
  Crown,
  Flag,
  Flame,
  Gem,
  Gift,
  Heart,
  Medal,
  Rocket,
  Shield,
  Sparkles,
  Star,
  ThumbsUp,
  Trophy,
  Zap,
} from "lucide-react";

export const BADGE_ICONS = {
  Award,
  Bug,
  Crown,
  Flag,
  Flame,
  Gem,
  Gift,
  Heart,
  Medal,
  Rocket,
  Shield,
  Sparkles,
  Star,
  ThumbsUp,
  Trophy,
  Zap,
} as const;

export type BadgeIconName = keyof typeof BADGE_ICONS;

export const BADGE_ICON_NAMES = Object.keys(BADGE_ICONS) as BadgeIconName[];

export function badgeIcon(name: string) {
  return BADGE_ICONS[name as BadgeIconName] ?? Award;
}

const BADGE_COLORS = [
  "default",
  "success",
  "warning",
  "danger",
  "info",
  "premium",
] as const;

export function badgeColor(color: string): (typeof BADGE_COLORS)[number] {
  return (BADGE_COLORS as readonly string[]).includes(color)
    ? (color as (typeof BADGE_COLORS)[number])
    : "default";
}
