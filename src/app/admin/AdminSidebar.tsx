"use client";

import {
  ArrowLeft,
  Award,
  BadgePercent,
  Bot,
  ChevronDown,
  ClipboardList,
  Coins,
  FileText,
  Flag,
  Gavel,
  Handshake,
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
  Users,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { useAdmin } from "./AdminContext";
import { type AdminCounts, useAdminCounts } from "./useAdminCounts";

interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  count?: keyof AdminCounts;
}

interface AdminNavGroup {
  label: string;
  items: AdminNavItem[];
}

const ADMIN_NAV: AdminNavGroup[] = [
  {
    label: "General",
    items: [
      { href: "/admin", label: "Overview", icon: LayoutDashboard },
      { href: "/admin/search", label: "Search", icon: Search },
      { href: "/admin/logs", label: "Logs", icon: ScrollText },
    ],
  },
  {
    label: "Moderation",
    items: [
      {
        href: "/admin/queue",
        label: "Queue",
        icon: ListChecks,
        count: "queue",
      },
      {
        href: "/admin/reports",
        label: "Reports",
        icon: Flag,
        count: "reports",
      },
      {
        href: "/admin/tickets",
        label: "Tickets",
        icon: LifeBuoy,
        count: "tickets",
      },
      {
        href: "/admin/applications",
        label: "Applications",
        icon: ClipboardList,
        count: "applications",
      },
      { href: "/admin/actions", label: "Global Actions", icon: Zap },
    ],
  },
  {
    label: "Staff",
    items: [
      { href: "/admin/staff/positions", label: "Positions", icon: ShieldCheck },
      { href: "/admin/staff/members", label: "Members", icon: Users },
      {
        href: "/admin/staff/disciplinary-types",
        label: "Disciplinary Types",
        icon: Gavel,
      },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/blog", label: "Blog", icon: FileText },
      { href: "/admin/changelog", label: "Changelog", icon: Megaphone },
      { href: "/admin/partners", label: "Partners", icon: Handshake },
      { href: "/admin/badges", label: "Badges", icon: Award },
      { href: "/admin/templates", label: "Templates", icon: LayoutTemplate },
    ],
  },
  {
    label: "Shop",
    items: [
      { href: "/admin/shop/items", label: "Items", icon: ShoppingBag },
      { href: "/admin/shop/benefits", label: "Benefits", icon: Sparkles },
      { href: "/admin/shop/tiers", label: "Vote Credit Tiers", icon: Coins },
      { href: "/admin/shop/coupons", label: "Coupons", icon: BadgePercent },
      { href: "/admin/shop/whitelist", label: "Bot Whitelist", icon: Bot },
      { href: "/admin/shop/purchases", label: "Purchases", icon: Receipt },
    ],
  },
];

const COLLAPSED_KEY = "omniplex-admin-collapsed-groups";
const RAIL_KEY = "omniplex-admin-rail";

export function findAdminNav(pathname: string) {
  for (const group of ADMIN_NAV) {
    const item = group.items.find((i) => isActive(pathname, i.href));
    if (item) return { group: group.label, item };
  }
  return null;
}

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
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

interface NavBodyProps {
  rail?: boolean;
  onNavigate?: () => void;
}

function NavBody({ rail = false, onNavigate }: NavBodyProps) {
  const pathname = usePathname();
  const { staffMember, logout } = useAdmin();
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
        items: needle
          ? g.items.filter((i) => i.label.toLowerCase().includes(needle))
          : g.items,
      })).filter((g) => g.items.length > 0),
    [needle],
  );

  const topPosition = [...(staffMember.positions ?? [])].sort(
    (a, b) => a.index - b.index,
  )[0];

  return (
    <div className="flex h-full flex-col">
      <div className={rail ? "px-2 pt-4" : "px-3 pt-4"}>
        <div
          className={[
            "flex items-center gap-2.5 rounded-xl",
            rail
              ? "justify-center"
              : "bg-white p-2.5 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800",
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
        </div>

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
                    const active = isActive(pathname, href);
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
          href="/"
          title={rail ? "Back to Omniplex" : undefined}
          className={[
            "flex items-center gap-2.5 rounded-lg text-sm text-zinc-500 transition-colors hover:bg-zinc-200/60 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800/70 dark:hover:text-zinc-50",
            rail ? "p-2" : "px-2.5 py-1.5",
          ].join(" ")}
        >
          <ArrowLeft size={16} className="shrink-0" />
          {!rail && "Back to Omniplex"}
        </Link>
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
        "sticky top-14 hidden h-[calc(100vh-3.5rem)] shrink-0 border-r border-zinc-200 bg-zinc-50/80 transition-[width] duration-200 lg:block dark:border-zinc-800 dark:bg-zinc-950",
        rail ? "w-16" : "w-64",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={toggleRail}
        aria-label={rail ? "Expand sidebar" : "Collapse sidebar"}
        title={rail ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute top-5 -right-3 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 shadow-sm transition-colors hover:text-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        {rail ? <PanelLeftOpen size={12} /> : <PanelLeftClose size={12} />}
      </button>
      <NavBody rail={rail} />
    </aside>
  );
}

export function AdminMobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const current = ADMIN_NAV.flatMap((g) => g.items).find((i) =>
    isActive(pathname, i.href),
  );
  const CurrentIcon = current?.icon ?? LayoutDashboard;

  return (
    <div className="px-4 pt-6 lg:hidden">
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
  );
}
