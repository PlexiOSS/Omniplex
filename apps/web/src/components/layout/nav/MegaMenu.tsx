"use client";

import { ArrowRight, ArrowUpRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Container } from "../Container";
import type { NavMenuItem } from "../NavGroupMenu";
import {
  DIRECT_LINKS,
  isActivePath,
  isExternal,
  MENUS,
  type NavMenu,
} from "./navConfig";

const OPEN_DELAY = 80;
const SWITCH_DELAY = 180;
const CLOSE_DELAY = 280;

function ItemLink({
  item,
  active,
  onNavigate,
}: {
  item: NavMenuItem;
  active: boolean;
  onNavigate: () => void;
}) {
  const Icon = item.icon;
  const external = isExternal(item.href);
  const className = [
    "group/item flex items-start gap-3 rounded-xl p-2.5 transition-colors",
    active ? "bg-accent/10" : "hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60",
  ].join(" ");
  const body = (
    <>
      {Icon && (
        <span
          className={[
            "flex size-9 shrink-0 items-center justify-center rounded-lg border transition-colors",
            active
              ? "border-accent/30 bg-accent/10 text-accent"
              : "border-zinc-200 bg-white text-zinc-500 group-hover/item:border-accent/30 group-hover/item:text-accent dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400",
          ].join(" ")}
        >
          <Icon size={16} />
        </span>
      )}
      <span className="min-w-0">
        <span
          className={[
            "flex items-center gap-1 text-sm font-medium",
            active ? "text-accent" : "text-zinc-900 dark:text-zinc-100",
          ].join(" ")}
        >
          {item.label}
          {external && <ArrowUpRight size={12} className="text-zinc-400" />}
        </span>
        {item.description && (
          <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">
            {item.description}
          </span>
        )}
      </span>
    </>
  );

  return external ? (
    <a
      href={item.href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onNavigate}
      className={className}
    >
      {body}
    </a>
  ) : (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={className}
    >
      {body}
    </Link>
  );
}

function Panel({
  menu,
  pathname,
  onNavigate,
}: {
  menu: NavMenu;
  pathname: string;
  onNavigate: () => void;
}) {
  const external = isExternal(menu.feature.href);
  const featureClass =
    "group/feature relative flex flex-col justify-end overflow-hidden rounded-2xl bg-accent p-5 text-accent-fg";
  const feature = (
    <>
      <span
        aria-hidden
        className="absolute -top-16 -right-16 size-48 rounded-full bg-white/15 blur-2xl"
      />
      <span
        aria-hidden
        className="absolute -bottom-20 -left-10 size-40 rounded-full bg-black/15 blur-2xl"
      />
      <span className="relative text-[11px] font-semibold tracking-wide uppercase opacity-80">
        {menu.feature.eyebrow}
      </span>
      <span className="relative mt-1 text-lg font-semibold leading-snug">
        {menu.feature.title}
      </span>
      <span className="relative mt-1 text-sm opacity-90">
        {menu.feature.body}
      </span>
      <span className="relative mt-4 inline-flex items-center gap-1 text-sm font-medium">
        {menu.feature.cta}
        <ArrowRight
          size={14}
          className="transition-transform group-hover/feature:translate-x-0.5"
        />
      </span>
    </>
  );

  return (
    <div className="absolute inset-x-0 top-full border-b border-zinc-200 bg-white shadow-xl shadow-zinc-950/5 dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-black/40">
      <Container>
        <div className="grid gap-6 py-6 lg:min-h-[21rem] lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div
            className="grid gap-x-4 gap-y-6"
            style={{
              gridTemplateColumns: `repeat(${menu.sections.length}, minmax(0, 1fr))`,
            }}
          >
            {menu.sections.map((section) => (
              <div key={section.title} className="min-w-0">
                {section.title && (
                  <p className="mb-2 px-2.5 text-[11px] font-semibold tracking-wide text-zinc-400 uppercase dark:text-zinc-500">
                    {section.title}
                  </p>
                )}
                <div className="space-y-0.5">
                  {section.items.map((item) => (
                    <ItemLink
                      key={item.href}
                      item={item}
                      active={isActivePath(pathname, item.href)}
                      onNavigate={onNavigate}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="hidden lg:flex">
            {external ? (
              <a
                href={menu.feature.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onNavigate}
                className={`${featureClass} w-full`}
              >
                {feature}
              </a>
            ) : (
              <Link
                href={menu.feature.href}
                onClick={onNavigate}
                className={`${featureClass} w-full`}
              >
                {feature}
              </Link>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}

export function MegaMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rootRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  function clear() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }

  function openSoon(id: string) {
    clear();
    if (open === id) return;
    if (!open) {
      timer.current = setTimeout(() => setOpen(id), OPEN_DELAY);
      return;
    }
    timer.current = setTimeout(() => {
      if (panelRef.current?.matches(":hover")) return;
      setOpen(id);
    }, SWITCH_DELAY);
  }

  function closeSoon() {
    clear();
    timer.current = setTimeout(() => setOpen(null), CLOSE_DELAY);
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname is a trigger, not read in the body
  useEffect(() => {
    setOpen(null);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(null);
    }
    function onDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(null);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const active = MENUS.find((m) => m.id === open);
  const linkClass = (on: boolean) =>
    [
      "relative flex h-9 items-center gap-1 rounded-lg px-3 text-sm font-medium transition-colors",
      on
        ? "text-zinc-950 dark:text-zinc-50"
        : "text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50",
    ].join(" ");
  const underline = (
    <span
      aria-hidden
      className="absolute inset-x-3 -bottom-3.25 h-0.5 rounded-full bg-accent"
    />
  );

  return (
    <nav
      ref={rootRef}
      aria-label="Main"
      onMouseEnter={clear}
      onMouseLeave={closeSoon}
      className="hidden h-16 items-center md:flex"
    >
      <div className="flex items-center gap-0.5">
        {DIRECT_LINKS.map((link) => {
          const on = isActivePath(pathname, link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={on ? "page" : undefined}
              className={linkClass(on)}
            >
              {link.label}
              {on && underline}
            </Link>
          );
        })}
        {MENUS.map((menu) => {
          const on =
            open === menu.id ||
            menu.sections.some((s) =>
              s.items.some((i) => isActivePath(pathname, i.href)),
            );
          return (
            <button
              key={menu.id}
              type="button"
              aria-expanded={open === menu.id}
              aria-controls={`nav-panel-${menu.id}`}
              onMouseEnter={() => openSoon(menu.id)}
              onClick={() => {
                clear();
                setOpen((o) => (o === menu.id ? null : menu.id));
              }}
              className={linkClass(on)}
            >
              {menu.label}
              <ChevronDown
                size={13}
                className={[
                  "transition-transform",
                  open === menu.id ? "rotate-180" : "",
                ].join(" ")}
              />
              {on && open !== menu.id && underline}
            </button>
          );
        })}
      </div>

      {active && (
        <div ref={panelRef} id={`nav-panel-${active.id}`}>
          <Panel
            menu={active}
            pathname={pathname}
            onNavigate={() => setOpen(null)}
          />
        </div>
      )}
    </nav>
  );
}
