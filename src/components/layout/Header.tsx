"use client";

import { Menu, Settings2, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { DiscordIcon, GithubIcon } from "@/components/ui/BrandIcons";
import { Button } from "@/components/ui/Button";
import { CustomizationPanel } from "@/components/ui/CustomizationPanel";
import { OmniplexLogo } from "@/components/ui/OmniplexLogo";
import { useAuth } from "@/hooks/useAuth";
import { SOCIAL_LINKS } from "@/lib/social";
import { Container } from "./Container";
import { ThemeToggle } from "./ThemeToggle";

const ICON_BUTTON =
  "flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50";

const NAV_LINKS = [
  { href: "/bots", label: "Bots" },
  { href: "/servers", label: "Servers" },
  { href: "/packs", label: "Packs" },
  { href: "/blog", label: "Blog" },
  { href: "/search", label: "Search" },
];

/**
 * Header component that displays the navigation bar at the top of the page.
 * @returns {JSX.Element} The rendered header component.
 */
export function Header() {
  const pathname = usePathname();
  const { session, isAuthenticated, logout } = useAuth();
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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
              href="/"
              className="flex items-center gap-2 text-zinc-950 dark:text-zinc-50"
            >
              <OmniplexLogo size={26} />
              <span className="text-base font-semibold tracking-tight">
                Omniplex
              </span>
            </Link>

            {/* Nav */}
            <nav className="items-center hidden gap-1 md:flex">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={[
                    "relative rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    pathname.startsWith(href)
                      ? "bg-accent/10 text-accent"
                      : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
                  ].join(" ")}
                >
                  {label}
                  {pathname.startsWith(href) && (
                    <span className="absolute inset-x-3 -bottom-2.25 h-0.5 rounded-full bg-accent" />
                  )}
                </Link>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-1">
              {/* Social links */}
              <a
                href={SOCIAL_LINKS.github}
                target="_blank"
                rel="noopener noreferrer"
                className={`hidden md:flex ${ICON_BUTTON}`}
                aria-label="Omniplex on GitHub"
              >
                <GithubIcon size={16} />
              </a>
              <a
                href={SOCIAL_LINKS.discord}
                target="_blank"
                rel="noopener noreferrer"
                className={`hidden md:flex ${ICON_BUTTON}`}
                aria-label="Omniplex on Discord"
              >
                <DiscordIcon size={16} />
              </a>

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

              <ThemeToggle />

              {isAuthenticated && session ? (
                <div className="flex items-center gap-2 ml-1">
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
                  className="inline-flex items-center justify-center h-8 px-3 ml-1 text-sm font-medium transition-opacity rounded-lg bg-accent text-accent-fg hover:opacity-90"
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
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={[
                    "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    pathname.startsWith(href)
                      ? "bg-accent/10 text-accent"
                      : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
                  ].join(" ")}
                >
                  {label}
                </Link>
              ))}
              <div className="mt-2 flex items-center gap-1 border-t border-zinc-200 pt-2 dark:border-zinc-800">
                <a
                  href={SOCIAL_LINKS.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={ICON_BUTTON}
                  aria-label="Omniplex on GitHub"
                >
                  <GithubIcon size={16} />
                </a>
                <a
                  href={SOCIAL_LINKS.discord}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={ICON_BUTTON}
                  aria-label="Omniplex on Discord"
                >
                  <DiscordIcon size={16} />
                </a>
              </div>
            </Container>
          </nav>
        )}
      </header>

      <CustomizationPanel
        open={customizeOpen}
        onClose={() => setCustomizeOpen(false)}
      />
    </>
  );
}
