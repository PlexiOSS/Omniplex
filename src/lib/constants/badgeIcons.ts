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

/**
 * A curated allow-list of lucide-react icons a badge can use, matched
 * against the icon name string a badges.icon column stores — never trusted
 * as an arbitrary/dynamic import, same reasoning as KNOWN_LINK_ICONS on the
 * user profile page.
 */
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

/** Guards an API-sourced color string down to the Badge component's variant enum. */
export function badgeColor(color: string): (typeof BADGE_COLORS)[number] {
  return (BADGE_COLORS as readonly string[]).includes(color)
    ? (color as (typeof BADGE_COLORS)[number])
    : "default";
}
