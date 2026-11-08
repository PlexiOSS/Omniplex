"use client";

import { STAFF_URL } from "@omniplex/core/api/config";
import { mirroredAvatarUrl } from "@omniplex/core/utils/assets";
import { Avatar } from "@omniplex/ui/Avatar";
import { OmniplexLogo } from "@omniplex/ui/OmniplexLogo";
import {
  ArrowUpRight,
  ChevronDown,
  ClipboardList,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Search,
  Settings2,
  Shield,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { BsDiscord } from "react-icons/bs";
import { openSearchPalette } from "@/components/search/SearchPalette";
import { CustomizationPanel } from "@/components/ui/CustomizationPanel";
import { SignInLink } from "@/components/ui/SignInLink";
import type { useAuth } from "@/hooks/useAuth";
import { SOCIAL_LINKS } from "@/lib/social";
import type { NavMenuItem } from "../NavGroupMenu";
import {
  CREATE_SECTIONS,
  DIRECT_LINKS,
  isActivePath,
  isExternal,
  MENUS,
} from "./navConfig";

type Session = NonNullable<ReturnType<typeof useAuth>["session"]>;

const SHEET_MS = 420;
const SHEET_EASE = "cubic-bezier(0.32, 0.72, 0, 1)";

function DrawerItem({ item, active }: { item: NavMenuItem; active: boolean }) {
  const Icon = item.icon;
  const external = isExternal(item.href);
  const className = [
    "flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium transition-colors",
    active
      ? "bg-accent/10 text-accent"
      : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800/70",
  ].join(" ");
  const body = (
    <>
      {Icon && (
        <span
          className={[
            "flex size-8 shrink-0 items-center justify-center rounded-lg",
            active
              ? "bg-accent/15 text-accent"
              : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
          ].join(" ")}
        >
          <Icon size={15} />
        </span>
      )}
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {external && <ArrowUpRight size={13} className="text-zinc-400" />}
    </>
  );
  return external ? (
    <a
      href={item.href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {body}
    </a>
  ) : (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={className}
    >
      {body}
    </Link>
  );
}

function Section({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-t border-zinc-200 pt-3 dark:border-zinc-800">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-2.5 pb-2 text-[11px] font-semibold tracking-wide text-zinc-400 uppercase dark:text-zinc-500"
      >
        {title}
        <ChevronDown
          size={14}
          className={["transition-transform", open ? "rotate-180" : ""].join(
            " ",
          )}
        />
      </button>
      {open && children}
    </section>
  );
}

export function MobileDrawer({
  open,
  onClose,
  session,
  isStaff,
  onLogout,
  returnFocusTo,
}: {
  open: boolean;
  onClose: () => void;
  session: Session | null;
  isStaff: boolean;
  onLogout: () => void;
  returnFocusTo: React.RefObject<HTMLButtonElement | null>;
}) {
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const gesture = useRef<{
    startY: number;
    lastY: number;
    lastT: number;
    velocity: number;
  } | null>(null);
  const dragYRef = useRef(0);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const begin = useCallback((y: number) => {
    gesture.current = {
      startY: y,
      lastY: y,
      lastT: performance.now(),
      velocity: 0,
    };
  }, []);

  const move = useCallback((y: number) => {
    const g = gesture.current;
    if (!g) return;
    const now = performance.now();
    const dt = Math.max(1, now - g.lastT);
    g.velocity = (y - g.lastY) / dt;
    g.lastY = y;
    g.lastT = now;
    const dy = y - g.startY;
    const next = dy > 0 ? dy : Math.max(-24, dy / 4);
    if (Math.abs(dy) > 3) setDragging(true);
    dragYRef.current = next;
    setDragY(next);
  }, []);

  const end = useCallback(() => {
    const g = gesture.current;
    gesture.current = null;
    if (!g) return;
    const height = panelRef.current?.offsetHeight ?? 600;
    const shouldClose =
      dragYRef.current > Math.min(140, height * 0.25) || g.velocity > 0.6;
    setDragging(false);
    dragYRef.current = 0;
    setDragY(0);
    if (shouldClose) onCloseRef.current();
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !open) return;
    let armed = false;
    let startY = 0;
    function onStart(e: TouchEvent) {
      armed = (el?.scrollTop ?? 0) <= 0;
      startY = e.touches[0].clientY;
    }
    function onMove(e: TouchEvent) {
      if (!armed) return;
      const y = e.touches[0].clientY;
      if (!gesture.current) {
        if (y - startY <= 4) {
          if (y < startY) armed = false;
          return;
        }
        begin(startY);
      }
      e.preventDefault();
      move(y);
    }
    function onEnd() {
      armed = false;
      end();
    }
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd);
    el.addEventListener("touchcancel", onEnd);
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
    };
  }, [open, begin, move, end]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    const toggle = returnFocusTo.current;
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
      toggle?.focus();
    };
  }, [open, onClose, returnFocusTo]);

  const accountLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ...(session
      ? [{ href: `/user/${session.user_id}`, label: "Profile", icon: User }]
      : []),
    { href: "/apps", label: "Applications", icon: ClipboardList },
    { href: "/tickets", label: "Support", icon: LifeBuoy },
  ];

  return (
    <div
      className={[
        "fixed inset-0 z-50 md:hidden",
        open ? "" : "pointer-events-none",
      ].join(" ")}
      inert={!open}
      aria-hidden={!open}
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close menu"
        onClick={onClose}
        className="absolute inset-0 bg-zinc-950/50 backdrop-blur-[2px]"
        style={{
          opacity: open ? Math.max(0, 1 - dragY / 400) : 0,
          transition: dragging ? "none" : `opacity ${SHEET_MS}ms ease`,
        }}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className="absolute inset-x-0 bottom-0 flex max-h-[90dvh] flex-col rounded-t-[1.75rem] border-t border-zinc-200 bg-white shadow-[0_-12px_40px_-12px_rgba(0,0,0,0.35)] dark:border-zinc-800 dark:bg-zinc-950"
        style={{
          transform: open ? `translateY(${dragY}px)` : "translateY(100%)",
          transition: dragging
            ? "none"
            : `transform ${SHEET_MS}ms ${SHEET_EASE}`,
        }}
      >
        <div
          className="shrink-0 cursor-grab touch-none select-none active:cursor-grabbing"
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            begin(e.clientY);
          }}
          onPointerMove={(e) => {
            if (gesture.current) move(e.clientY);
          }}
          onPointerUp={end}
          onPointerCancel={end}
        >
          <div className="flex justify-center pt-2.5 pb-1">
            <span
              aria-hidden
              className="h-1.5 w-10 rounded-full bg-zinc-300 dark:bg-zinc-700"
            />
          </div>
          <div className="flex items-center justify-between px-4 pb-2">
            <Link
              href="/"
              className="flex items-center gap-2 text-zinc-950 dark:text-zinc-50"
            >
              <OmniplexLogo size={22} />
              <span className="font-semibold tracking-tight">Omniplex</span>
            </Link>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="flex size-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition-colors hover:text-zinc-900 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-3 pt-2 pb-4"
        >
          <button
            type="button"
            onClick={() => {
              onClose();
              openSearchPalette();
            }}
            className="flex h-11 w-full items-center gap-2.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-500 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
          >
            <Search size={16} />
            Search bots and servers
          </button>

          <div className="grid grid-cols-3 gap-2">
            {DIRECT_LINKS.map((link) => {
              const on = isActivePath(pathname, link.href);
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={on ? "page" : undefined}
                  className={[
                    "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-medium transition-colors",
                    on
                      ? "border-accent/40 bg-accent/10 text-accent"
                      : "border-zinc-200 text-zinc-700 hover:border-accent/30 hover:text-accent dark:border-zinc-800 dark:text-zinc-300",
                  ].join(" ")}
                >
                  <Icon size={18} />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {MENUS.flatMap((menu) => menu.sections).map((section) => (
            <Section
              key={section.title}
              title={section.title ?? ""}
              defaultOpen={section.items.some((i) =>
                isActivePath(pathname, i.href),
              )}
            >
              <div className="grid grid-cols-2 gap-0.5">
                {section.items.map((item) => (
                  <DrawerItem
                    key={item.href}
                    item={item}
                    active={isActivePath(pathname, item.href)}
                  />
                ))}
              </div>
            </Section>
          ))}

          <Section title="Create">
            <div className="space-y-0.5">
              {CREATE_SECTIONS.flatMap((s) => s.items).map((item) => (
                <DrawerItem
                  key={item.href}
                  item={item}
                  active={isActivePath(pathname, item.href)}
                />
              ))}
            </div>
          </Section>

          <section className="border-t border-zinc-200 pt-3 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setCustomizeOpen((o) => !o)}
              aria-expanded={customizeOpen}
              className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800/70"
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                <Settings2 size={15} />
              </span>
              <span className="flex-1 text-left">Customize</span>
              <ChevronDown
                size={14}
                className={[
                  "text-zinc-400 transition-transform",
                  customizeOpen ? "rotate-180" : "",
                ].join(" ")}
              />
            </button>
            {customizeOpen && (
              <div className="-mx-1 mt-1">
                <CustomizationPanel
                  inline
                  open
                  onClose={() => setCustomizeOpen(false)}
                />
              </div>
            )}
            <a
              href={SOCIAL_LINKS.discord}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800/70"
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-[#5865F2]/10 text-[#5865F2]">
                <BsDiscord size={15} />
              </span>
              <span className="flex-1">Join our Discord</span>
              <ArrowUpRight size={13} className="text-zinc-400" />
            </a>
          </section>
        </div>

        <div className="shrink-0 border-t border-zinc-200 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-zinc-800">
          {session ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3 px-1">
                <Avatar
                  src={mirroredAvatarUrl(
                    "users",
                    session.user_id,
                    session.avatar,
                  )}
                  alt={session.username ?? "Your profile"}
                  size={36}
                />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                  {session.username ?? "Your account"}
                </span>
                <button
                  type="button"
                  onClick={onLogout}
                  aria-label="Sign out"
                  className="flex size-9 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                >
                  <LogOut size={16} />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {accountLinks.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex flex-col items-center gap-1 rounded-lg py-2 text-[11px] font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                  >
                    <Icon size={16} />
                    {label}
                  </Link>
                ))}
              </div>
              {isStaff && (
                <a
                  href={STAFF_URL}
                  className="flex items-center justify-center gap-2 rounded-lg border border-zinc-200 py-2 text-xs font-medium text-zinc-600 transition-colors hover:border-accent/30 hover:text-accent dark:border-zinc-800 dark:text-zinc-400"
                >
                  <Shield size={13} />
                  Staff panel
                </a>
              )}
            </div>
          ) : (
            <SignInLink className="flex h-11 w-full items-center justify-center rounded-xl bg-accent text-sm font-medium text-accent-fg transition-opacity hover:opacity-90">
              Sign in with Discord
            </SignInLink>
          )}
        </div>
      </div>
    </div>
  );
}
