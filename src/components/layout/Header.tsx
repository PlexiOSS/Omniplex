"use client";

import {
  ChevronDown,
  LogOut,
  Menu,
  Plus,
  Settings2,
  Shield,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BsDiscord, BsGithub, BsInstagram, BsTwitter } from "react-icons/bs";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Avatar } from "@/components/ui/Avatar";
import { CustomizationPanel } from "@/components/ui/CustomizationPanel";
import { OmniplexLogo } from "@/components/ui/OmniplexLogo";
import { SignInLink } from "@/components/ui/SignInLink";
import { useArcadiaAuth } from "@/hooks/useArcadiaAuth";
import { useAuth } from "@/hooks/useAuth";
import { useMe } from "@/hooks/useMe";
import { SOCIAL_LINKS } from "@/lib/social";
import { mirroredAvatarUrl } from "@/lib/utils/assets";
import { Container } from "./Container";
import { NavGroupMenu } from "./NavGroupMenu";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";

interface NavLink {
  href: string;
  label: string;
}

interface NavGroup {
  label: string;
  items: NavLink[];
}

const ICON_BUTTON =
  "flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50";

const NAV_LINKS: (NavLink | NavGroup)[] = [
  { href: "/", label: "Home" },
  {
    label: "Browse",
    items: [
      { href: "/bots", label: "Bots" },
      { href: "/servers", label: "Servers" },
      { href: "/packs", label: "Packs" },
      { href: "/emojis", label: "Emojis" },
    ],
  },
  {
    label: "Community",
    items: [
      { href: "/about", label: "About Us" },
      { href: "/blog", label: "Blog Posts" },
      { href: "/changelog", label: "Changelog" },
      { href: "/partners", label: "Our Partners" },
      { href: "/kb", label: "Knowledge Base" },
      { href: "https://docs.omniplex.gg", label: "Documentation" },
    ],
  },
  { href: "/search", label: "Search" },
];

const CREATE_LINKS = [
  { href: "/bots/add", label: "Add a Bot" },
  { href: "/servers/add", label: "Add a Server" },
  { href: "/packs/add", label: "Add a Pack" },
  { href: "/teams/add", label: "Create a Team" },
];

const ADMIN_NAV_LINKS: (NavLink | NavGroup)[] = [
  { href: "/admin", label: "Overview" },
  {
    label: "Moderation",
    items: [
      { href: "/admin/queue", label: "Queue" },
      { href: "/admin/applications", label: "Applications" },
      { href: "/admin/reports", label: "Reports" },
      { href: "/admin/tickets", label: "Tickets" },
    ],
  },
  {
    label: "Staff",
    items: [
      { href: "/admin/staff/positions", label: "Positions" },
      { href: "/admin/staff/members", label: "Members" },
      { href: "/admin/staff/disciplinary-types", label: "Disciplinary Types" },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/blog", label: "Blog" },
      { href: "/admin/partners", label: "Partners" },
    ],
  },
  { href: "/admin/search", label: "Search" },
  { href: "/admin/logs", label: "Logs" },
];

function isNavGroup(item: NavLink | NavGroup): item is NavGroup {
  return "items" in item;
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, isAuthenticated, logout } = useAuth();
  const { isAuthenticated: isStaffAuthenticated, logout: staffLogout } =
    useArcadiaAuth();
  const { me } = useMe(session);
  const isStaff = me?.staff ?? false;
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [openMobileGroup, setOpenMobileGroup] = useState<string | null>(null);

  const isAdminSection =
    pathname.startsWith("/admin") &&
    pathname !== "/admin/login" &&
    !pathname.startsWith("/admin/auth");
  const links = isAdminSection ? ADMIN_NAV_LINKS : NAV_LINKS;
  const isActiveLink = (href: string) => {
    if (isAdminSection) return pathname === href;
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  function exitStaffPanel() {
    router.push("/");
  }

  // Close the mobile nav whenever the route changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname is a trigger, not read in the body
  useEffect(() => {
    setMobileNavOpen(false);
    setOpenMobileGroup(null);
  }, [pathname]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
        <Container>
          <div className="flex items-center justify-between gap-4 h-14">
            {/* Logo */}
            <Link
              href={isAdminSection ? "/admin" : "/"}
              className="flex items-center gap-2 text-zinc-950 dark:text-zinc-50"
            >
              <OmniplexLogo size={26} />
              <span className="text-base font-semibold tracking-tight">
                Omniplex
              </span>
              {isAdminSection && (
                <span className="flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                  <Shield size={11} />
                  Staff
                </span>
              )}
            </Link>

            {/* Nav */}
            <nav className="items-center hidden gap-1 md:flex">
              {links.map((item) =>
                isNavGroup(item) ? (
                  <NavGroupMenu
                    key={item.label}
                    label={item.label}
                    items={item.items}
                    active={item.items.some((i) => isActiveLink(i.href))}
                  />
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      "relative rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                      isActiveLink(item.href)
                        ? "bg-accent/10 text-accent"
                        : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
                    ].join(" ")}
                  >
                    {item.label}
                    {isActiveLink(item.href) && (
                      <span className="absolute inset-x-3 -bottom-2.25 h-0.5 rounded-full bg-accent" />
                    )}
                  </Link>
                ),
              )}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-1">
              {/* Create menu */}
              {!isAdminSection && (
                <NavGroupMenu label="Create" icon={Plus} items={CREATE_LINKS} />
              )}

              {/* Social links */}
              <a
                href={SOCIAL_LINKS.discord}
                target="_blank"
                rel="noopener noreferrer"
                className={`hidden md:flex ${ICON_BUTTON}`}
                aria-label="Omniplex on Discord"
              >
                <BsDiscord size={16} />
              </a>

              {isAdminSection && isStaffAuthenticated && (
                <button
                  type="button"
                  onClick={exitStaffPanel}
                  className={ICON_BUTTON}
                  aria-label="Exit staff panel"
                  title="Exit staff panel"
                >
                  <LogOut size={16} />
                </button>
              )}
              {/* Mobile nav toggle */}
              <button
                type="button"
                onClick={() => setMobileNavOpen((o) => !o)}
                className={[
                  "flex h-9 w-9 items-center justify-center rounded-lg transition-colors md:hidden",
                  mobileNavOpen
                    ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
                ].join(" ")}
                aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileNavOpen}
              >
                {mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
              </button>

              {/* Customize */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setCustomizeOpen((o) => !o)}
                  className={[
                    "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                    customizeOpen
                      ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                      : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
                  ].join(" ")}
                  aria-label="Customize appearance"
                >
                  <Settings2 size={16} />
                </button>
                <CustomizationPanel
                  open={customizeOpen}
                  onClose={() => setCustomizeOpen(false)}
                />
              </div>

              <NotificationBell />

              <ThemeToggle />

              {isAuthenticated && session ? (
                <div className="hidden ml-1 md:block">
                  <UserMenu
                    session={session}
                    isStaff={isStaff}
                    onLogout={logout}
                  />
                </div>
              ) : (
                <SignInLink className="items-center justify-center hidden h-8 px-3 ml-1 text-sm font-medium transition-opacity rounded-lg md:inline-flex bg-accent text-accent-fg hover:opacity-90">
                  Sign in
                </SignInLink>
              )}
            </div>
          </div>
        </Container>

        {/* Mobile nav panel */}
        {mobileNavOpen && (
          <nav className="border-t border-zinc-200 md:hidden dark:border-zinc-800">
            <Container className="flex flex-col gap-1 py-3">
              {links.map((item) =>
                isNavGroup(item) ? (
                  <div
                    key={item.label}
                    className="pt-2 mt-2 border-t border-zinc-200 first:mt-0 first:border-0 first:pt-0 dark:border-zinc-800"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setOpenMobileGroup((g) =>
                          g === item.label ? null : item.label,
                        )
                      }
                      className={[
                        "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        item.items.some((i) => isActiveLink(i.href))
                          ? "text-accent"
                          : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
                      ].join(" ")}
                      aria-expanded={openMobileGroup === item.label}
                    >
                      {item.label}
                      <ChevronDown
                        size={14}
                        className={[
                          "transition-transform",
                          openMobileGroup === item.label ? "rotate-180" : "",
                        ].join(" ")}
                      />
                    </button>
                    {openMobileGroup === item.label && (
                      <div className="pl-2">
                        {item.items.map((sub) => (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className={[
                              "rounded-lg px-3 py-2 text-sm font-medium transition-colors block",
                              isActiveLink(sub.href)
                                ? "bg-accent/10 text-accent"
                                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
                            ].join(" ")}
                          >
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActiveLink(item.href)
                        ? "bg-accent/10 text-accent"
                        : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
                    ].join(" ")}
                  >
                    {item.label}
                  </Link>
                ),
              )}
              {isAuthenticated && session ? (
                <div className="pt-2 mt-2 border-t border-zinc-200 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenMobileGroup((g) =>
                        g === "Account" ? null : "Account",
                      )
                    }
                    className={[
                      "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                      openMobileGroup === "Account"
                        ? "text-accent"
                        : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
                    ].join(" ")}
                    aria-expanded={openMobileGroup === "Account"}
                  >
                    <Avatar
                      src={mirroredAvatarUrl(
                        "users",
                        session.user_id,
                        session.avatar,
                      )}
                      alt={session.username ?? "Your profile"}
                      size={28}
                    />
                    <span className="flex-1 truncate text-zinc-700 dark:text-zinc-300">
                      {session.username ?? "Your account"}
                    </span>
                    <ChevronDown
                      size={14}
                      className={[
                        "transition-transform",
                        openMobileGroup === "Account" ? "rotate-180" : "",
                      ].join(" ")}
                    />
                  </button>
                  {openMobileGroup === "Account" && (
                    <div className="pl-2">
                      <Link
                        href="/dashboard"
                        className="block rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                      >
                        Dashboard
                      </Link>
                      <Link
                        href={`/user/${session.user_id}`}
                        className="block rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                      >
                        View Profile
                      </Link>
                      <Link
                        href="/apps"
                        className="block rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                      >
                        Applications
                      </Link>
                      <Link
                        href="/tickets"
                        className="block rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                      >
                        Support Tickets
                      </Link>
                      {isStaff && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                        >
                          <Shield size={14} />
                          Staff Panel
                        </Link>
                      )}
                      <Link
                        href="/premium"
                        className="block rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                      >
                        Premium
                      </Link>
                      <Link
                        href="/shop"
                        className="block rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                      >
                        Shop
                      </Link>
                      <button
                        type="button"
                        onClick={logout}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                      >
                        <LogOut size={14} />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <SignInLink className="inline-flex items-center justify-center px-3 mx-3 text-sm font-medium transition-opacity rounded-lg h-9 bg-accent text-accent-fg hover:opacity-90">
                  Sign in
                </SignInLink>
              )}

              <div className="flex items-center gap-1 pt-2 mt-2 border-t border-zinc-200 dark:border-zinc-800">
                <a
                  href={SOCIAL_LINKS.discord}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={ICON_BUTTON}
                  aria-label="Omniplex on Discord"
                >
                  <BsDiscord size={16} />
                </a>
              </div>
            </Container>
          </nav>
        )}
      </header>
    </>
  );
}
