import {
  Gem,
  type LucideIcon,
  Repeat,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

export interface ShopProduct {
  id: "premium" | "auto-vote" | "items" | "booster";
  href: string;
  name: string;
  icon: LucideIcon;
  tagline: string;
  points: string[];
  cta: string;
  glow: string;
  iconTone: string;
}

export const SHOP_PRODUCTS: ShopProduct[] = [
  {
    id: "premium",
    href: "/shop/premium",
    name: "Premium",
    icon: Sparkles,
    tagline: "Make your bot or server stand out.",
    points: [
      "A 4-hour vote cooldown instead of 12",
      "Premium badge on the card and page",
      "A spot in the homepage highlights",
    ],
    cta: "Upgrade a listing",
    glow: "from-violet-500/25 via-indigo-500/10",
    iconTone: "bg-violet-500/15 text-violet-500 ring-violet-500/25",
  },
  {
    id: "auto-vote",
    href: "/shop/auto-vote",
    name: "Auto-vote",
    icon: Repeat,
    tagline: "Never miss a vote for the bots you love.",
    points: [
      "Votes as soon as your cooldown ends",
      "Your own schedule for each listing",
      "3 listings included, room for more",
    ],
    cta: "Start Auto-vote",
    glow: "from-emerald-500/25 via-teal-500/10",
    iconTone: "bg-emerald-500/15 text-emerald-500 ring-emerald-500/25",
  },
  {
    id: "items",
    href: "/shop/items",
    name: "Credit shop",
    icon: ShoppingBag,
    tagline: "Turn your listing's votes into perks.",
    points: [
      "Boosts, featured slots and bonus days",
      "Paid for with earned vote credits",
      "No card needed",
    ],
    cta: "Spend credits",
    glow: "from-amber-500/25 via-orange-500/10",
    iconTone: "bg-amber-500/15 text-amber-500 ring-amber-500/25",
  },
  {
    id: "booster",
    href: "/shop/booster",
    name: "Booster perks",
    icon: Gem,
    tagline: "A thank you for boosting our Discord.",
    points: [
      "A month of Bronze premium, every month",
      "A free extra Auto-vote slot",
      "The Server Booster badge",
    ],
    cta: "See your perks",
    glow: "from-pink-500/25 via-fuchsia-500/10",
    iconTone: "bg-pink-500/15 text-pink-500 ring-pink-500/25",
  },
];

export function productFor(pathname: string) {
  return SHOP_PRODUCTS.find(
    (p) => pathname === p.href || pathname.startsWith(`${p.href}/`),
  );
}
