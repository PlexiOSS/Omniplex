import {
  BookOpen,
  Bot,
  Code2,
  Crown,
  Gift,
  LayoutDashboard,
  LifeBuoy,
  type LucideIcon,
  Package,
  Rocket,
  Server,
  ShieldCheck,
  ThumbsUp,
  UserRound,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  basics: Rocket,
  bots: Bot,
  servers: Server,
  listings: LayoutDashboard,
  developers: Code2,
  packs: Package,
  voting: ThumbsUp,
  programs: Gift,
  account: UserRound,
  premium: Crown,
  support: LifeBuoy,
  staff: ShieldCheck,
};

export function kbCategoryIcon(slug: string): LucideIcon {
  return ICONS[slug] ?? BookOpen;
}
