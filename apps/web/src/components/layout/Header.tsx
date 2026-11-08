"use client";

import { OmniplexLogo } from "@omniplex/ui/OmniplexLogo";
import { Menu, Plus, Settings2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { SearchPalette } from "@/components/search/SearchPalette";
import { CustomizationPanel } from "@/components/ui/CustomizationPanel";
import { SignInLink } from "@/components/ui/SignInLink";
import { useAuth } from "@/hooks/useAuth";
import { useMe } from "@/hooks/useMe";
import { Container } from "./Container";
import { NavGroupMenu } from "./NavGroupMenu";
import { MegaMenu } from "./nav/MegaMenu";
import { MobileDrawer } from "./nav/MobileDrawer";
import { CREATE_SECTIONS } from "./nav/navConfig";
import { UserMenu } from "./UserMenu";

const ICON_BUTTON =
  "flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, isAuthenticated, logout } = useAuth();
  const { me } = useMe(session);
  const isStaff = me?.staff ?? false;
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  useEffect(() => {
    if (
      me?.banned &&
      pathname !== "/banned" &&
      !pathname.startsWith("/apps/banappeal") &&
      !pathname.startsWith("/auth")
    ) {
      router.replace("/banned");
    }
  }, [me?.banned, pathname, router]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname is a trigger, not read in the body
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={[
          "sticky top-0 z-40 border-b backdrop-blur-xl transition-colors",
          scrolled
            ? "border-zinc-200 bg-white/85 dark:border-zinc-800 dark:bg-zinc-950/85"
            : "border-transparent bg-white/60 dark:bg-zinc-950/60",
        ].join(" ")}
      >
        <Container>
          <div className="flex h-16 items-center gap-6">
            <Link
              href="/"
              className="flex shrink-0 items-center gap-2 text-zinc-950 dark:text-zinc-50"
            >
              <OmniplexLogo size={26} />
              <span className="text-base font-semibold tracking-tight">
                Omniplex
              </span>
            </Link>

            <MegaMenu />

            <div className="ml-auto flex items-center gap-1">
              <SearchPalette />

              <div className="hidden md:block">
                <NavGroupMenu
                  label="Create"
                  icon={Plus}
                  sections={CREATE_SECTIONS}
                />
              </div>

              <div className="relative hidden md:block">
                <button
                  type="button"
                  onClick={() => setCustomizeOpen((o) => !o)}
                  className={[
                    ICON_BUTTON,
                    customizeOpen
                      ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                      : "",
                  ].join(" ")}
                  aria-label="Customize appearance"
                  aria-expanded={customizeOpen}
                >
                  <Settings2 size={16} />
                </button>
                <CustomizationPanel
                  open={customizeOpen}
                  onClose={() => setCustomizeOpen(false)}
                />
              </div>

              <NotificationBell />

              {isAuthenticated && session ? (
                <div className="ml-1 hidden md:block">
                  <UserMenu
                    session={session}
                    isStaff={isStaff}
                    onLogout={logout}
                  />
                </div>
              ) : (
                <SignInLink className="ml-1 hidden h-9 items-center justify-center rounded-lg bg-accent px-4 text-sm font-medium text-accent-fg transition-opacity hover:opacity-90 md:inline-flex">
                  Sign in
                </SignInLink>
              )}

              <button
                ref={menuButtonRef}
                type="button"
                onClick={() => setDrawerOpen(true)}
                className={`${ICON_BUTTON} md:hidden`}
                aria-label="Open menu"
                aria-expanded={drawerOpen}
                aria-haspopup="dialog"
              >
                <Menu size={20} />
              </button>
            </div>
          </div>
        </Container>
      </header>

      <MobileDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        session={isAuthenticated ? session : null}
        isStaff={isStaff}
        onLogout={logout}
        returnFocusTo={menuButtonRef}
      />
    </>
  );
}
