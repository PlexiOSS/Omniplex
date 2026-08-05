"use client";

import { LogOut, Menu, Plus, Settings2, Shield, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BsDiscord, BsGithub, BsInstagram, BsTwitter } from "react-icons/bs";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { CustomizationPanel } from "@/components/ui/CustomizationPanel";
import { OmniplexLogo } from "@/components/ui/OmniplexLogo";
import { useArcadiaAuth } from "@/hooks/useArcadiaAuth";
import { useAuth } from "@/hooks/useAuth";
import { useMe } from "@/hooks/useMe";
import { SOCIAL_LINKS } from "@/lib/social";
import { Container } from "./Container";
import { NavGroupMenu } from "./NavGroupMenu";
import { ThemeToggle } from "./ThemeToggle";

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

// Blog/Partners/Knowledge Base/About previously lived only in the footer —
// grouped into "Community" here so they're reachable from anywhere, while
// keeping the top-level row from growing past what fits comfortably.
const NAV_LINKS: (NavLink | NavGroup)[] = [
  { href: "/", label: "Home" },
  {
    label: "Browse",
    items: [
      { href: "/bots", label: "Bots" },
      { href: "/servers", label: "Servers" },
      { href: "/packs", label: "Packs" },
    ],
  },
  { href: "/search", label: "Search" },
  {
    label: "Community",
    items: [
      { href: "/blog", label: "Blog" },
      { href: "/partners", label: "Partners" },
      { href: "https://docs.omniplex.gg", label: "Documentation" },
      { href: "/about", label: "About Us" },
    ],
  },
];

const CREATE_LINKS = [
  { href: "/bots/add", label: "Add a Bot" },
  { href: "/servers/add", label: "Add a Server" },
  { href: "/packs/add", label: "Add a Pack" },
  { href: "/teams/add", label: "Create a Team" },
];

// The staff panel (/admin/**) swaps in its own nav here rather than running
// a second header — /admin/login and /admin/auth/callback are excluded since
// those sit outside the gate and have no staff nav to show yet. Related
// pages are grouped into dropdowns (Staff, Content) rather than listed flat —
// this grows every time a new admin section is added, and a flat row of 10
// links stopped fitting comfortably.
const ADMIN_NAV_LINKS: (NavLink | NavGroup)[] = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/queue", label: "Queue" },
  { href: "/admin/search", label: "Search" },
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
  { href: "/admin/logs", label: "Logs" },
];

function isNavGroup(item: NavLink | NavGroup): item is NavGroup {
  return "items" in item;
}

/**
 * Header component that displays the navigation bar at the top of the page.
 * @returns {JSX.Element} The rendered header component.
 */
export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, isAuthenticated, logout } = useAuth();
  const { isAuthenticated: isStaffAuthenticated, logout: staffLogout } =
    useArcadiaAuth();
  // `me.staff` reflects real staff status regardless of whether this browser
  // has an active Arcadia panel session yet — isStaffAuthenticated alone only
  // tells us they've logged into /admin before, not whether they're staff.
  const { me } = useMe(session);
  const isStaff = me?.staff ?? false;
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isAdminSection =
    pathname.startsWith("/admin") &&
    pathname !== "/admin/login" &&
    !pathname.startsWith("/admin/auth");
  const links = isAdminSection ? ADMIN_NAV_LINKS : NAV_LINKS;
  const isActiveLink = (href: string) => {
    if (isAdminSection) return pathname === href;
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  function exitStaffPanel() {
    router.push("/");
  }

  // Close the mobile nav whenever the route changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname is a trigger, not read in the body
  useEffect(() => {
    setMobileNavOpen(false);
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
                <div className="hidden md:block">
                  <Button variant="ghost" size="sm" onClick={exitStaffPanel}>
                    <LogOut size={14} />
                    Exit panel
                  </Button>
                </div>
              )}
              {!isAdminSection && isStaff && (
                <Link href="/admin" className="hidden md:block">
                  <Button variant="ghost" size="sm">
                    <Shield size={14} />
                    Staff panel
                  </Button>
                </Link>
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

              <ThemeToggle />

              {isAuthenticated && session ? (
                <div className="items-center hidden gap-2 ml-1 md:flex">
                  <Link href="/dashboard">
                    <Avatar
                      src={session.avatar}
                      alt={session.username ?? "Your profile"}
                      size={32}
                      className="cursor-pointer ring-2 ring-transparent hover:ring-zinc-300 dark:hover:ring-zinc-600"
                    />
                  </Link>
                  <Button variant="ghost" size="sm" onClick={logout}>
                    Sign out
                  </Button>
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  className="items-center justify-center hidden h-8 px-3 ml-1 text-sm font-medium transition-opacity rounded-lg md:inline-flex bg-accent text-accent-fg hover:opacity-90"
                >
                  Sign in
                </Link>
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
                  <div key={item.label} className="pt-2 mt-2 border-t border-zinc-200 first:mt-0 first:border-0 first:pt-0 dark:border-zinc-800">
                    <p className="px-3 pb-1 text-xs font-medium tracking-wide uppercase text-zinc-400 dark:text-zinc-600">
                      {item.label}
                    </p>
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
              {!isAdminSection && (
                <div className="pt-2 mt-2 border-t border-zinc-200 dark:border-zinc-800">
                  <p className="px-3 pb-1 text-xs font-medium tracking-wide uppercase text-zinc-400 dark:text-zinc-600">
                    Create
                  </p>
                  {CREATE_LINKS.map(({ href, label }) => (
                    <Link
                      key={href}
                      href={href}
                      className="block px-3 py-2 text-sm font-medium transition-colors rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              )}
              {isAdminSection && isStaffAuthenticated && (
                <button
                  type="button"
                  onClick={exitStaffPanel}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-left transition-colors rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                >
                  <LogOut size={14} />
                  Exit staff panel
                </button>
              )}
              {!isAdminSection && isStaff && (
                <Link
                  href="/admin"
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                >
                  <Shield size={14} />
                  Staff panel
                </Link>
              )}

              {isAuthenticated && session ? (
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
                  <Link href="/dashboard" className="flex items-center gap-2">
                    <Avatar
                      src={session.avatar}
                      alt={session.username ?? "Your profile"}
                      size={32}
                    />
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      {session.username ?? "Your profile"}
                    </span>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={logout}
                    className="ml-auto"
                  >
                    Sign out
                  </Button>
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  className="inline-flex items-center justify-center px-3 mx-3 text-sm font-medium transition-opacity rounded-lg h-9 bg-accent text-accent-fg hover:opacity-90"
                >
                  Sign in
                </Link>
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
