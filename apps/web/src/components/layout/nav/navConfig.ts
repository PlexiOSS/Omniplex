import {
  Activity,
  Award,
  BookOpen,
  Bot,
  FileCode,
  History,
  LayoutList,
  LayoutTemplate,
  type LucideIcon,
  Newspaper,
  Package,
  Palette,
  Rss,
  Server,
  ShoppingBag,
  Smile,
  SquareTerminal,
  Sticker,
  Tag,
  Trophy,
  Users,
  Volume2,
} from "lucide-react";
import { SOCIAL_LINKS } from "@/lib/social";
import type { NavMenuSection } from "../NavGroupMenu";

export interface NavFeature {
  href: string;
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
}

export interface NavMenu {
  id: string;
  label: string;
  sections: NavMenuSection[];
  feature: NavFeature;
}

export interface NavDirect {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const DIRECT_LINKS: NavDirect[] = [
  { href: "/bots", label: "Bots", icon: Bot },
  { href: "/servers", label: "Servers", icon: Server },
  { href: "/shop", label: "Shop", icon: ShoppingBag },
];

export const MENUS: NavMenu[] = [
  {
    id: "explore",
    label: "Explore",
    sections: [
      {
        title: "Discover",
        items: [
          {
            href: "/packs",
            label: "Packs",
            description: "Curated bundles",
            icon: Package,
          },
          {
            href: "/collections",
            label: "Collections",
            description: "Best-of lists by votes",
            icon: LayoutList,
          },
          {
            href: "/tags",
            label: "Tags",
            description: "Browse by category",
            icon: Tag,
          },
          {
            href: "/commands",
            label: "Commands",
            description: "Search every bot command",
            icon: SquareTerminal,
          },
        ],
      },
      {
        title: "For your server",
        items: [
          {
            href: "/emojis",
            label: "Emojis",
            description: "Custom emojis to grab",
            icon: Smile,
          },
          {
            href: "/stickers",
            label: "Stickers",
            description: "Sticker packs",
            icon: Sticker,
          },
          {
            href: "/sounds",
            label: "Sounds",
            description: "Soundboard clips",
            icon: Volume2,
          },
          {
            href: "/templates",
            label: "Templates",
            description: "Ready-made server setups",
            icon: LayoutTemplate,
          },
          {
            href: "/themes",
            label: "Themes",
            description: "Discord profile colours",
            icon: Palette,
          },
        ],
      },
    ],
    feature: {
      href: "/collections",
      eyebrow: "Collections",
      title: "The best of Omniplex",
      body: "Hand-picked lists of top bots and servers, ranked by votes.",
      cta: "Browse collections",
    },
  },
  {
    id: "community",
    label: "Community",
    sections: [
      {
        title: "What's new",
        items: [
          {
            href: "/blog",
            label: "Blog",
            description: "News and announcements",
            icon: Newspaper,
          },
          {
            href: "/changelog",
            label: "Changelog",
            description: "Every site update",
            icon: History,
          },
          {
            href: "/feed",
            label: "Updates feed",
            description: "Changelogs from bots and servers",
            icon: Rss,
          },
        ],
      },
      {
        title: "People",
        items: [
          {
            href: "/leaderboard",
            label: "Leaderboard",
            description: "Top voters",
            icon: Trophy,
          },
          {
            href: "/badges",
            label: "Badges",
            description: "What they mean",
            icon: Award,
          },
          {
            href: "/about/team",
            label: "Our team",
            description: "Who runs Omniplex",
            icon: Users,
          },
        ],
      },
      {
        title: "Help",
        items: [
          {
            href: "/kb",
            label: "Knowledge Base",
            description: "Guides and FAQs",
            icon: BookOpen,
          },
          {
            href: "https://docs.omniplex.gg",
            label: "Documentation",
            description: "API and developer docs",
            icon: FileCode,
          },
          {
            href: "https://status.omniplex.gg",
            label: "Status",
            description: "Uptime and incidents",
            icon: Activity,
          },
        ],
      },
    ],
    feature: {
      href: SOCIAL_LINKS.discord,
      eyebrow: "Discord",
      title: "Join the community",
      body: "Get help, meet other developers and hear about new features first.",
      cta: "Join our server",
    },
  },
];

export const CREATE_SECTIONS: NavMenuSection[] = [
  {
    items: [
      {
        href: "/bots/add",
        label: "Add a Bot",
        description: "List your Discord bot",
        icon: Bot,
      },
      {
        href: "/servers/add",
        label: "Add a Server",
        description: "List your community",
        icon: Server,
      },
      {
        href: "/packs/add",
        label: "Add a Pack",
        description: "Bundle bots, emojis or sounds",
        icon: Package,
      },
      {
        href: "/themes/add",
        label: "Submit a Theme",
        description: "Share a profile theme",
        icon: Palette,
      },
      {
        href: "/teams/add",
        label: "Create a Team",
        description: "Manage listings together",
        icon: Users,
      },
    ],
  },
];

export function isExternal(href: string) {
  return /^https?:\/\//.test(href);
}

export function isActivePath(pathname: string, href: string) {
  if (isExternal(href)) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
