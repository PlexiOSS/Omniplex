"use client";

import type { PageStyle } from "@omniplex/core/api/types";
import { accentVars } from "@omniplex/core/utils/pageStyle";
import { Avatar } from "@omniplex/ui/Avatar";
import {
  ArrowLeft,
  ExternalLink,
  Monitor,
  Moon,
  Smartphone,
  Star,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { PageBackground } from "./PageBackground";

export interface PagePreviewListing {
  name: string;
  avatar: string;
  short: string;
  tags: string[];
  banner?: string | null;
}

type Device = "desktop" | "phone";
type Mode = "light" | "dark";

const VIRTUAL = {
  desktop: { width: 1280, height: 800 },
  phone: { width: 390, height: 780 },
} as const;

const PHONE_WIDTH = 260;

const TOKENS: Record<Mode, CSSProperties> = {
  dark: {
    "--p-page": "var(--color-zinc-950)",
    "--p-card": "var(--color-zinc-900)",
    "--p-line": "var(--color-zinc-800)",
    "--p-chip": "var(--color-zinc-800)",
    "--p-ink": "var(--color-zinc-50)",
    "--p-soft": "var(--color-zinc-300)",
    "--p-muted": "var(--color-zinc-400)",
  } as CSSProperties,
  light: {
    "--p-page": "#ffffff",
    "--p-card": "#ffffff",
    "--p-line": "var(--color-zinc-200)",
    "--p-chip": "var(--color-zinc-100)",
    "--p-ink": "var(--color-zinc-950)",
    "--p-soft": "var(--color-zinc-700)",
    "--p-muted": "var(--color-zinc-500)",
  } as CSSProperties,
};

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string; icon: typeof Sun }[];
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="inline-flex rounded-lg border border-zinc-200 p-0.5 dark:border-zinc-800">
      <legend className="sr-only">{label}</legend>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          aria-label={o.label}
          title={o.label}
          onClick={() => onChange(o.value)}
          className={[
            "flex size-7 items-center justify-center rounded-md transition-colors",
            value === o.value
              ? "bg-zinc-100 text-zinc-950 dark:bg-zinc-800 dark:text-zinc-50"
              : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200",
          ].join(" ")}
        >
          <o.icon size={14} />
        </button>
      ))}
    </fieldset>
  );
}

function Lines({ widths }: { widths: string[] }) {
  return (
    <div className="space-y-2.5">
      {widths.map((w) => (
        <div
          key={w}
          className="h-2.5 rounded-full bg-(--p-chip)"
          style={{ width: w }}
        />
      ))}
    </div>
  );
}

function MockPage({
  listing,
  phone,
  target,
}: {
  listing: PagePreviewListing;
  phone: boolean;
  target: "bot" | "server";
}) {
  const actions = (
    <div className="space-y-2 rounded-2xl border border-(--p-line) bg-(--p-card) p-4">
      <div className="flex h-10 items-center justify-center gap-2 rounded-xl bg-accent text-sm font-medium text-accent-fg">
        <ExternalLink size={14} />
        {target === "bot" ? "Add to Server" : "Join Server"}
      </div>
      <div className="flex h-10 items-center justify-center gap-2 rounded-xl border border-(--p-line) text-sm font-medium text-(--p-ink)">
        <Star size={14} />
        Vote
      </div>
    </div>
  );

  return (
    <div className="relative z-10 flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center gap-6 border-b border-(--p-line) bg-(--p-page) px-6">
        <span className="size-7 rounded-full border-4 border-(--p-ink)" />
        <span className="text-base font-semibold text-(--p-ink)">Omniplex</span>
        {!phone &&
          ["Bots", "Servers", "Shop"].map((n) => (
            <span key={n} className="text-sm text-(--p-muted)">
              {n}
            </span>
          ))}
      </div>
      <div
        className={
          phone ? "px-4 py-6" : "mx-auto w-full max-w-[72rem] px-8 py-8"
        }
      >
        <p className="mb-5 flex items-center gap-1.5 text-sm text-(--p-muted)">
          <ArrowLeft size={14} />
          Back to {target}s
        </p>
        {listing.banner && (
          <div
            className={`mb-6 rounded-2xl bg-cover bg-center ${phone ? "h-32" : "h-52"}`}
            style={{ backgroundImage: `url("${listing.banner}")` }}
          />
        )}
        <div
          className={phone ? "space-y-5" : "grid grid-cols-[1fr_320px] gap-8"}
        >
          <div className="min-w-0">
            <div className="flex items-start gap-4">
              <Avatar src={listing.avatar} alt="" size={64} />
              <div className="min-w-0 flex-1">
                <p className="text-2xl font-semibold text-(--p-ink)">
                  {listing.name}
                </p>
                <p className="mt-1 line-clamp-3 text-base text-(--p-soft)">
                  {listing.short}
                </p>
              </div>
            </div>
            {listing.tags.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {listing.tags.slice(0, 5).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-(--p-chip) px-3 py-1 text-xs font-medium text-(--p-soft)"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {phone && <div className="mt-5">{actions}</div>}
            <div className="mt-6 flex gap-5 border-b border-(--p-line)">
              <span className="border-b-2 border-accent pb-2 text-sm font-medium text-accent">
                Overview
              </span>
              <span className="pb-2 text-sm text-(--p-muted)">Reviews</span>
            </div>
            <div className="mt-6 rounded-2xl border border-(--p-line) bg-(--p-card) p-5">
              <Lines widths={["92%", "100%", "84%", "96%", "62%"]} />
            </div>
          </div>
          {!phone && (
            <div className="space-y-4">
              {actions}
              <div className="rounded-2xl border border-(--p-line) bg-(--p-card) p-5">
                <Lines widths={["70%", "88%", "54%"]} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function PageStylePreview({
  target,
  id,
  style,
  image,
  listing,
  note,
}: {
  target: "bot" | "server";
  id: string;
  style: PageStyle;
  image: string | null;
  listing: PagePreviewListing;
  note?: string;
}) {
  const { resolvedTheme } = useTheme();
  const [device, setDevice] = useState<Device>("desktop");
  const [modeChoice, setModeChoice] = useState<Mode | null>(null);
  const [width, setWidth] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const mode: Mode =
    modeChoice ?? (resolvedTheme === "light" ? "light" : "dark");

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const virtual = VIRTUAL[device];
  const shown = device === "phone" ? Math.min(width, PHONE_WIDTH) : width;
  const scale = shown / virtual.width;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
          Preview
        </p>
        <div className="flex items-center gap-2">
          <Segmented
            label="Preview size"
            value={device}
            onChange={setDevice}
            options={[
              { value: "desktop", label: "Desktop", icon: Monitor },
              { value: "phone", label: "Phone", icon: Smartphone },
            ]}
          />
          <Segmented
            label="Preview theme"
            value={mode}
            onChange={setModeChoice}
            options={[
              { value: "light", label: "Light mode", icon: Sun },
              { value: "dark", label: "Dark mode", icon: Moon },
            ]}
          />
        </div>
      </div>

      <div ref={boxRef}>
        <div
          className={[
            "mx-auto overflow-hidden border border-zinc-200 shadow-sm dark:border-zinc-800",
            device === "phone" ? "rounded-3xl" : "rounded-xl",
          ].join(" ")}
          style={{ width: shown || undefined }}
        >
          {device === "desktop" && (
            <div className="flex h-7 items-center gap-1.5 border-b border-zinc-200 bg-zinc-100 px-3 dark:border-zinc-800 dark:bg-zinc-800">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="size-2 rounded-full bg-zinc-300 dark:bg-zinc-600"
                />
              ))}
            </div>
          )}
          <div
            className="relative overflow-hidden"
            style={{ height: virtual.height * scale }}
          >
            {width > 0 && (
              <div
                className="relative isolate origin-top-left bg-(--p-page)"
                style={{
                  ...TOKENS[mode],
                  ...accentVars(style),
                  width: virtual.width,
                  height: virtual.height,
                  transform: `scale(${scale})`,
                }}
              >
                <PageBackground
                  target={target}
                  id={id}
                  style={{ ...style, image_version: null }}
                  imageOverride={image}
                  previewColor="var(--p-page)"
                />
                <MockPage
                  listing={listing}
                  phone={device === "phone"}
                  target={target}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      {note && (
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{note}</p>
      )}
    </div>
  );
}
