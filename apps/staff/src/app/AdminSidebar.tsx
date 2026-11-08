"use client";

import { SITE_URL } from "@omniplex/core/api/config";
import { Avatar } from "@omniplex/ui/Avatar";
import { OmniplexLogo } from "@omniplex/ui/OmniplexLogo";
import {
  Activity,
  ArrowLeft,
  Award,
  BadgePercent,
  Bot,
  CalendarClock,
  ChevronDown,
  ClipboardList,
  Coins,
  CreditCard,
  FileText,
  Flag,
  Gavel,
  Handshake,
  Image as ImageIcon,
  LayoutDashboard,
  LayoutTemplate,
  LifeBuoy,
  ListChecks,
  LogOut,
  type LucideIcon,
  Megaphone,
  PanelLeftClose,
  PanelLeftOpen,
  Receipt,
  ScrollText,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Ticket,
  UserCog,
  Users,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAdmin } from "@/app/AdminContext";
import { type AdminCounts, useAdminCounts } from "@/app/useAdminCounts";
import { ThemeToggle } from "@/components/ThemeToggle";

interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  count?: keyof AdminCounts;
  perm?: string;
}

interface AdminNavGroup {
  label: string;
  items: AdminNavItem[];
}

const ADMIN_NAV: AdminNavGroup[] = [
  {
    label: "General",
    items: [
      { href: "/", label: "Overview", icon: LayoutDashboard },
      { href: "/search", label: "Search", icon: Search },
      {
        href: "/activity",
        label: "Activity",
        icon: Activity,
        perm: "view_audit_logs",
      },
      {
        href: "/logs",
        label: "RPC Logs",
        icon: ScrollText,
        perm: "view_audit_logs",
      },
      { href: "/account", label: "Account", icon: UserCog },
    ],
  },
  {
    label: "Moderation",
    items: [
      {
        href: "/queue",
        label: "Queue",
        icon: ListChecks,
        count: "queue",
      },
      {
        href: "/backgrounds",
        label: "Backgrounds",
        icon: ImageIcon,
        count: "backgrounds",
        perm: "review_entities",
      },
      {
        href: "/reports",
        label: "Reports",
        icon: Flag,
        count: "reports",
        perm: "review_reports",
      },
      {
        href: "/tickets",
        label: "Tickets",
        icon: LifeBuoy,
        count: "tickets",
        perm: "view_tickets",
      },
      {
        href: "/applications",
        label: "Applications",
        icon: ClipboardList,
        count: "applications",
        perm: "view_apps",
      },
      {
        href: "/applications/forms",
        label: "Application Forms",
        icon: FileText,
        perm: "manage_app_positions",
      },
      { href: "/actions", label: "Global Actions", icon: Zap },
    ],
  },
  {
    label: "Staff",
    items: [
      {
        href: "/staff/positions",
        label: "Positions",
        icon: ShieldCheck,
        perm: "view_staff",
      },
      {
        href: "/staff/members",
        label: "Members",
        icon: Users,
        perm: "view_staff",
      },
      {
        href: "/staff/disciplinaries",
        label: "Disciplinaries",
        icon: CalendarClock,
        perm: "manage_disciplinaries",
        count: "disciplinaries",
      },
      {
        href: "/staff/disciplinary-types",
        label: "Disciplinary Types",
        icon: Gavel,
      },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/blog", label: "Blog", icon: FileText, perm: "manage_blog" },
      {
        href: "/changelog",
        label: "Changelog",
        icon: Megaphone,
        perm: "manage_changelog",
      },
      {
        href: "/partners",
        label: "Partners",
        icon: Handshake,
        perm: "manage_partners",
      },
      { href: "/badges", label: "Badges", icon: Award, perm: "manage_badges" },
      {
        href: "/templates",
        label: "Templates",
        icon: LayoutTemplate,
        perm: "manage_templates",
      },
    ],
  },
  {
    label: "Shop",
    items: [
      {
        href: "/shop/items",
        label: "Items",
        icon: ShoppingBag,
        perm: "view_shop",
      },
      {
        href: "/shop/benefits",
        label: "Benefits",
        icon: Sparkles,
        perm: "view_shop",
      },
      {
        href: "/shop/tiers",
        label: "Vote Credit Tiers",
        icon: Coins,
        perm: "view_shop",
      },
      {
        href: "/shop/coupons",
        label: "Coupons",
        icon: BadgePercent,
        perm: "view_shop",
      },
      {
        href: "/shop/promo-codes",
        label: "Promo Codes",
        icon: Ticket,
        perm: "view_shop",
      },
      {
        href: "/shop/whitelist",
        label: "Bot Whitelist",
        icon: Bot,
        perm: "manage_bot_whitelist",
      },
      {
        href: "/shop/purchases",
        label: "Purchases",
        icon: Receipt,
        perm: "view_shop",
      },
      {
        href: "/payments",
        label: "Payments",
        icon: CreditCard,
        perm: "view_payments",
      },
    ],
  },
];

const COLLAPSED_KEY = "omniplex-admin-collapsed-groups";
const RAIL_KEY = "omniplex-admin-rail";

export function findAdminNav(pathname: string) {
  let best: { group: string; item: AdminNavItem } | null = null;
  for (const group of ADMIN_NAV) {
    for (const item of group.items) {
      if (
        isActive(pathname, item.href) &&
        (!best || item.href.length > best.item.href.length)
      ) {
        best = { group: group.label, item };
      }
    }
  }
  return best;
}

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function CountPill({ value, active }: { value: number; active: boolean }) {
  if (value <= 0) return null;
  return (
    <span
      className={[
        "ml-auto rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
        active
          ? "bg-accent text-accent-fg"
          : "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
      ].join(" ")}
    >
      {value > 99 ? "99+" : value}
    </span>
  );
}

const ICON_BUTTON =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-200/60 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800/70 dark:hover:text-zinc-50";

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      className="flex min-w-0 items-center gap-2 text-zinc-950 dark:text-zinc-50"
      title={compact ? "Omniplex Staff" : undefined}
    >
      <OmniplexLogo size={compact ? 26 : 24} className="shrink-0" />
      {!compact && (
        <>
          <span className="text-[15px] font-semibold tracking-tight">
            Omniplex
          </span>
          <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">
            Staff
          </span>
        </>
      )}
    </Link>
  );
}

interface NavBodyProps {
  rail?: boolean;
  onNavigate?: () => void;
  onToggleRail?: () => void;
}

function NavBody({ rail = false, onNavigate, onToggleRail }: NavBodyProps) {
  const pathname = usePathname();
  const activeHref = findAdminNav(pathname)?.item.href;
  const { staffMember, logout, hasPerm } = useAdmin();
  const counts = useAdminCounts();
  const [filter, setFilter] = useState("");
  const [collapsed, setCollapsed] = useState<string[]>([]);

  useEffect(() => {
    setCollapsed(readStorage<string[]>(COLLAPSED_KEY, []));
  }, []);

  function toggleGroup(label: string) {
    setCollapsed((prev) => {
      const next = prev.includes(label)
        ? prev.filter((g) => g !== label)
        : [...prev, label];
      writeStorage(COLLAPSED_KEY, next);
      return next;
    });
  }

  const needle = filter.trim().toLowerCase();
  const groups = useMemo(
    () =>
      ADMIN_NAV.map((g) => ({
        ...g,
        items: g.items.filter(
          (i) =>
            (!i.perm || hasPerm(i.perm)) &&
            (!needle || i.label.toLowerCase().includes(needle)),
        ),
      })).filter((g) => g.items.length > 0),
    [needle, hasPerm],
  );

  const topPosition = [...(staffMember.positions ?? [])].sort(
    (a, b) => a.index - b.index,
  )[0];

  return (
    <div className="flex h-full flex-col">
      {onToggleRail && (
        <div
          className={[
            "flex h-14 shrink-0 items-center border-b border-zinc-200 dark:border-zinc-800",
            rail
              ? "flex-col justify-center gap-1 px-2"
              : "justify-between pr-2 pl-4",
          ].join(" ")}
        >
          {rail ? (
            <button
              type="button"
              onClick={onToggleRail}
              aria-label="Expand sidebar"
              title="Expand sidebar"
              className={ICON_BUTTON}
            >
              <PanelLeftOpen size={16} />
            </button>
          ) : (
            <>
              <Brand />
              <button
                type="button"
                onClick={onToggleRail}
                aria-label="Collapse sidebar"
                title="Collapse sidebar"
                className={ICON_BUTTON}
              >
                <PanelLeftClose size={16} />
              </button>
            </>
          )}
        </div>
      )}
      <div className={rail ? "px-2 pt-4" : "px-3 pt-4"}>
        <Link
          href="/account"
          onClick={onNavigate}
          className={[
            "flex items-center gap-2.5 rounded-xl transition-colors",
            rail
              ? "justify-center"
              : "bg-white p-2.5 ring-1 ring-zinc-200 hover:ring-accent/40 dark:bg-zinc-900 dark:ring-zinc-800",
          ].join(" ")}
          title={rail ? staffMember.user.username : undefined}
        >
          <Avatar
            src={staffMember.user.avatar}
            alt={staffMember.user.username}
            size={rail ? 32 : 34}
          />
          {!rail && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                {staffMember.user.display_name || staffMember.user.username}
              </p>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                {topPosition?.name ?? "Staff"}
              </p>
            </div>
          )}
        </Link>

        {!rail && (
          <label className="mt-3 flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-2.5 dark:border-zinc-800 dark:bg-zinc-900">
            <Search size={13} className="shrink-0 text-zinc-400" />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Jump to…"
              aria-label="Filter staff panel pages"
              className="h-8 w-full bg-transparent text-sm text-zinc-950 outline-none placeholder:text-zinc-400 dark:text-zinc-50"
            />
            {filter && (
              <button
                type="button"
                onClick={() => setFilter("")}
                aria-label="Clear filter"
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <X size={13} />
              </button>
            )}
          </label>
        )}
      </div>

      <nav className="admin-scroll mt-3 flex-1 overflow-y-auto px-2 pb-4">
        {groups.length === 0 && (
          <p className="px-2 py-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
            No pages match.
          </p>
        )}
        {groups.map((group) => {
          const open = rail || needle || !collapsed.includes(group.label);
          const groupCount = group.items.reduce(
            (sum, i) => sum + (i.count ? (counts[i.count] ?? 0) : 0),
            0,
          );
          return (
            <div key={group.label} className={rail ? "py-1.5" : "py-1"}>
              {rail ? (
                <div className="mx-auto my-1 h-px w-6 bg-zinc-200 first:hidden dark:bg-zinc-800" />
              ) : (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.label)}
                  aria-expanded={!!open}
                  className="flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 transition-colors hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300"
                >
                  <ChevronDown
                    size={12}
                    className={[
                      "transition-transform",
                      open ? "" : "-rotate-90",
                    ].join(" ")}
                  />
                  {group.label}
                  {!open && groupCount > 0 && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-amber-500" />
                  )}
                </button>
              )}
              {open && (
                <ul className="mt-0.5 space-y-0.5">
                  {group.items.map(({ href, label, icon: Icon, count }) => {
                    const active = href === activeHref;
                    const value = count ? (counts[count] ?? 0) : 0;
                    return (
                      <li key={href}>
                        <Link
                          href={href}
                          onClick={onNavigate}
                          title={rail ? label : undefined}
                          aria-current={active ? "page" : undefined}
                          className={[
                            "relative flex items-center gap-2.5 rounded-lg text-sm transition-colors",
                            rail ? "justify-center p-2" : "px-2.5 py-1.5",
                            active
                              ? "bg-accent/10 font-medium text-accent"
                              : "text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800/70 dark:hover:text-zinc-50",
                          ].join(" ")}
                        >
                          <Icon size={16} className="shrink-0" />
                          {rail ? (
                            value > 0 && (
                              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-zinc-50 dark:ring-zinc-950" />
                            )
                          ) : (
                            <>
                              <span className="truncate">{label}</span>
                              <CountPill value={value} active={active} />
                            </>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      <div
        className={[
          "border-t border-zinc-200 py-3 dark:border-zinc-800",
          rail ? "flex flex-col items-center gap-1 px-2" : "space-y-0.5 px-2",
        ].join(" ")}
      >
        <Link
          href={SITE_URL}
          title={rail ? "Back to Omniplex" : undefined}
          className={[
            "flex items-center gap-2.5 rounded-lg text-sm text-zinc-500 transition-colors hover:bg-zinc-200/60 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800/70 dark:hover:text-zinc-50",
            rail ? "p-2" : "px-2.5 py-1.5",
          ].join(" ")}
        >
          <ArrowLeft size={16} className="shrink-0" />
          {!rail && "Back to Omniplex"}
        </Link>
        <ThemeToggle
          label={!rail}
          className={[
            "flex w-full items-center gap-2.5 rounded-lg text-sm text-zinc-500 transition-colors hover:bg-zinc-200/60 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800/70 dark:hover:text-zinc-50",
            rail ? "justify-center p-2" : "px-2.5 py-1.5",
          ].join(" ")}
        />
        <button
          type="button"
          onClick={logout}
          title={rail ? "Sign out" : undefined}
          className={[
            "flex w-full items-center gap-2.5 rounded-lg text-sm text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-950/40 dark:hover:text-red-400",
            rail ? "justify-center p-2" : "px-2.5 py-1.5",
          ].join(" ")}
        >
          <LogOut size={16} className="shrink-0" />
          {!rail && "Sign out"}
        </button>
      </div>
    </div>
  );
}

export function AdminSidebar() {
  const [rail, setRail] = useState(false);

  useEffect(() => {
    setRail(readStorage<boolean>(RAIL_KEY, false));
  }, []);

  function toggleRail() {
    setRail((r) => {
      writeStorage(RAIL_KEY, !r);
      return !r;
    });
  }

  return (
    <aside
      className={[
        "sticky top-0 hidden h-screen shrink-0 border-r border-zinc-200 bg-zinc-50/80 transition-[width] duration-200 lg:block dark:border-zinc-800 dark:bg-zinc-950",
        rail ? "w-16" : "w-64",
      ].join(" ")}
    >
      <NavBody rail={rail} onToggleRail={toggleRail} />
    </aside>
  );
}

export function AdminMobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const current = findAdminNav(pathname)?.item;
  const CurrentIcon = current?.icon ?? LayoutDashboard;

  return (
    <div className="lg:hidden">
      <div className="flex h-14 items-center justify-between border-b border-zinc-200 px-4 dark:border-zinc-800">
        <Brand />
        <ThemeToggle className={ICON_BUTTON} />
      </div>
      <div className="px-4 pt-4">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex w-full items-center gap-2.5 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:border-accent/40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
        >
          <CurrentIcon size={15} className="text-accent" />
          <span className="flex-1 text-left">
            {current?.label ?? "Staff panel"}
          </span>
          <ChevronDown
            size={15}
            className={[
              "text-zinc-400 transition-transform",
              open ? "rotate-180" : "",
            ].join(" ")}
          />
        </button>
        {open && (
          <div className="mt-2 h-[min(70vh,36rem)] overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
            <NavBody onNavigate={() => setOpen(false)} />
          </div>
        )}
      </div>
    </div>
  );
}
