"use client";

import { list } from "@omniplex/core/api";
import {
  Check,
  Cloud,
  CloudOff,
  Monitor,
  Moon,
  RotateCcw,
  Search,
  Sun,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import {
  ACCENT_OPTIONS,
  type AccentColor,
  CARD_STAT_OPTIONS,
  DENSITY_OPTIONS,
  FONT_OPTIONS,
  type FontOption,
  LAYOUT_OPTIONS,
  type LayoutOption,
  MAX_HIDDEN_TAGS,
  MOTION_OPTIONS,
  presetActive,
  RADIUS_OPTIONS,
  type RadiusOption,
  SURFACE_OPTIONS,
  type SurfaceOption,
  type SyncState,
  TEXT_SIZE_OPTIONS,
  type TextSizeOption,
  THEME_PRESETS,
  type ThemePreset,
  tagSlug,
  useCustomization,
} from "@/hooks/useCustomization";
import { ACCENT_COLORS } from "@/lib/constants/accent";

interface CustomizationPanelProps {
  open: boolean;
  onClose: () => void;
  inline?: boolean;
}

type Tab = "theme" | "fonts" | "layout" | "content";

const TABS: { key: Tab; label: string }[] = [
  { key: "theme", label: "Theme" },
  { key: "fonts", label: "Fonts" },
  { key: "layout", label: "Layout" },
  { key: "content", label: "Content" },
];

const MODES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

const LAYOUT_WIDTH: Record<LayoutOption, string> = {
  compact: "55%",
  comfortable: "72%",
  wide: "92%",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-xs font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
      {children}
    </p>
  );
}

const TEXT_PREVIEW: Record<TextSizeOption, string> = {
  small: "0.95rem",
  default: "1.05rem",
  large: "1.2rem",
  larger: "1.35rem",
};

const SYNC_LABELS: Record<SyncState, string> = {
  device: "Saved on this device",
  account: "Synced to your account",
  saving: "Saving to your account…",
  error: "Couldn't sync, saved on this device",
};

function surfaceColors(surface: SurfaceOption, dark: boolean) {
  const s =
    SURFACE_OPTIONS.find((o) => o.value === surface) ?? SURFACE_OPTIONS[0];
  return dark ? s.dark : s.light;
}

function PresetPreview({
  preset,
  dark,
}: {
  preset: ThemePreset;
  dark: boolean;
}) {
  const [page, card, line] = surfaceColors(preset.surface, dark);
  const corner = RADIUS_OPTIONS.find((r) => r.value === preset.radius)?.preview;
  const family = FONT_OPTIONS.find((f) => f.value === preset.font)?.family;
  const ink = dark ? "#f4f4f5" : "#18181b";
  return (
    <span
      aria-hidden
      className="flex h-16 w-full gap-1.5 overflow-hidden border p-1.5"
      style={{ backgroundColor: page, borderColor: line, borderRadius: corner }}
    >
      <span
        className="flex flex-1 flex-col justify-between border p-1.5"
        style={{
          backgroundColor: card,
          borderColor: line,
          borderRadius: corner,
        }}
      >
        <span
          className="text-sm leading-none font-semibold"
          style={{ fontFamily: family, color: ink }}
        >
          Aa
        </span>
        <span className="flex items-center gap-1">
          <span
            className="h-1.5 w-6 rounded-full"
            style={{ backgroundColor: ACCENT_COLORS[preset.accent] }}
          />
          <span
            className="h-1.5 w-4 rounded-full opacity-60"
            style={{ backgroundColor: line }}
          />
        </span>
      </span>
      <span className="flex w-5 flex-col gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 rounded-full"
            style={{ backgroundColor: line }}
          />
        ))}
      </span>
    </span>
  );
}

function ChoiceRow<T extends string>({
  options,
  value,
  onChange,
  render,
}: {
  options: { value: T; label: string; description?: string }[];
  value: T;
  onChange: (value: T) => void;
  render?: (
    option: { value: T; label: string },
    active: boolean,
  ) => React.ReactNode;
}) {
  return (
    <div
      className="grid gap-2"
      style={{
        gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
      }}
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            title={opt.description}
            onClick={() => onChange(opt.value)}
            className={`${optionClass(active)} flex flex-col items-center gap-1 px-1.5 py-2`}
          >
            {render?.(opt, active)}
            <span
              className={[
                "text-xs font-medium",
                active ? "text-accent" : "text-zinc-700 dark:text-zinc-300",
              ].join(" ")}
            >
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Toggle({
  title,
  description,
  checked,
  disabled = false,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className={[
        "flex items-start justify-between gap-3 rounded-xl border border-zinc-200 px-3 py-2.5 dark:border-zinc-700",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
      ].join(" ")}
    >
      <span>
        <span className="block text-sm font-medium text-zinc-950 dark:text-zinc-50">
          {title}
        </span>
        <span className="block text-xs text-zinc-500 dark:text-zinc-400">
          {description}
        </span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-300 accent-accent disabled:cursor-not-allowed dark:border-zinc-600"
      />
    </label>
  );
}

function HiddenTags() {
  const { hiddenTags, toggleTag } = useCustomization();
  const [query, setQuery] = useState("");
  const { data } = useSWR("list-tags", () => list.getTags());
  const known = useMemo(() => {
    const seen = new Map<string, { label: string; count: number }>();
    for (const t of data?.tags ?? []) {
      const slug = tagSlug(t.tag);
      if (!slug) continue;
      const prev = seen.get(slug);
      seen.set(slug, {
        label: prev?.label ?? t.tag,
        count: (prev?.count ?? 0) + t.bots + t.servers,
      });
    }
    return seen;
  }, [data]);
  const q = tagSlug(query);
  const suggestions = [...known.entries()]
    .filter(([slug]) => !hiddenTags.includes(slug) && (!q || slug.includes(q)))
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 8);
  const full = hiddenTags.length >= MAX_HIDDEN_TAGS;

  return (
    <div>
      <SectionLabel>Hidden tags</SectionLabel>
      <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
        Bots and servers with any of these tags are left out of browse, search
        and the home page.
      </p>
      {hiddenTags.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {hiddenTags.map((slug) => (
            <button
              key={slug}
              type="button"
              onClick={() => toggleTag(slug)}
              aria-label={`Show ${known.get(slug)?.label ?? slug} again`}
              className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent"
            >
              {known.get(slug)?.label ?? slug}
              <X size={11} />
            </button>
          ))}
        </div>
      )}
      <div className="relative">
        <Search
          size={14}
          className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-zinc-400"
        />
        <input
          value={query}
          disabled={full}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && q) {
              e.preventDefault();
              toggleTag(q);
              setQuery("");
            }
          }}
          placeholder={
            full ? "That's the most you can hide" : "Find a tag to hide"
          }
          aria-label="Find a tag to hide"
          className="w-full rounded-lg border border-zinc-200 bg-white py-1.5 pr-2 pl-8 text-sm text-zinc-950 outline-none placeholder:text-zinc-400 focus:border-accent/50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        />
      </div>
      {!full && suggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {suggestions.map(([slug, info]) => (
            <button
              key={slug}
              type="button"
              onClick={() => {
                toggleTag(slug);
                setQuery("");
              }}
              className="rounded-full border border-zinc-200 px-2.5 py-1 text-xs text-zinc-600 transition-colors hover:border-accent/40 hover:text-accent dark:border-zinc-700 dark:text-zinc-300"
            >
              {info.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function optionClass(active: boolean) {
  return [
    "rounded-xl border text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
    active
      ? "border-accent bg-accent/5"
      : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:border-zinc-600 dark:hover:bg-zinc-800/60",
  ].join(" ");
}

export function CustomizationPanel({
  open,
  onClose,
  inline = false,
}: CustomizationPanelProps) {
  const prefs = useCustomization();
  const {
    accent,
    font,
    layout,
    radius,
    surface,
    density,
    textSize,
    motion,
    hideNsfw,
    blurNsfw,
    hideOffline,
    setAccent,
    setFont,
    setLayout,
    setRadius,
    applyPreset,
    setHideNsfw,
    setBlurNsfw,
    hiddenStats,
    toggleStat,
    resetPrefs,
    update,
    sync,
  } = prefs;
  const { theme, setTheme, resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  const panelRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<Tab>("theme");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || inline) return;
    function onClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open, onClose, inline]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className={
        inline
          ? ""
          : "fixed inset-x-3 top-16 z-50 mx-auto max-w-sm rounded-2xl border border-zinc-200 bg-white shadow-xl sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mx-0 sm:mt-2 sm:w-[23rem] sm:max-w-[calc(100vw-1.5rem)] dark:border-zinc-700 dark:bg-zinc-900"
      }
    >
      <div
        className={[
          "flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800",
          inline ? "hidden" : "",
        ].join(" ")}
      >
        <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
          Customize
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
        >
          <X size={15} />
        </button>
      </div>

      <div className="flex items-center gap-1 border-b border-zinc-200 px-2 pt-2 dark:border-zinc-800">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={[
              "relative -mb-px shrink-0 rounded-t-lg border-b-2 px-3 pb-2 text-sm font-medium transition-colors",
              tab === t.key
                ? "border-accent text-accent"
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50",
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div
        className={[
          "space-y-5 p-4",
          inline ? "" : "max-h-[min(70vh,34rem)] overflow-y-auto",
        ].join(" ")}
      >
        {tab === "theme" && (
          <>
            <div>
              <SectionLabel>Mode</SectionLabel>
              <div className="grid grid-cols-3 gap-2">
                {MODES.map(({ value, label, icon: Icon }) => {
                  const active = mounted && theme === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setTheme(value)}
                      className={`${optionClass(active)} flex flex-col items-center gap-1.5 px-2 py-2.5`}
                    >
                      <Icon
                        size={16}
                        className={active ? "text-accent" : "text-zinc-500"}
                      />
                      <span
                        className={[
                          "text-xs font-medium",
                          active
                            ? "text-accent"
                            : "text-zinc-700 dark:text-zinc-300",
                        ].join(" ")}
                      >
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <SectionLabel>Presets</SectionLabel>
              <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
                Each one sets colours, font, corners and spacing together. Tweak
                anything afterwards.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {THEME_PRESETS.map((preset) => {
                  const active =
                    mounted &&
                    presetActive(preset, prefs) &&
                    (!preset.mode || resolvedTheme === preset.mode);
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => applyPreset(preset)}
                      className={`${optionClass(active)} flex flex-col gap-2 p-2`}
                    >
                      <PresetPreview
                        preset={preset}
                        dark={preset.mode ? preset.mode === "dark" : dark}
                      />
                      <span className="min-w-0 px-0.5">
                        <span className="flex items-center gap-1.5">
                          <span
                            className={[
                              "truncate text-sm font-medium",
                              active
                                ? "text-accent"
                                : "text-zinc-950 dark:text-zinc-50",
                            ].join(" ")}
                          >
                            {preset.label}
                          </span>
                          {preset.mode && (
                            <span className="shrink-0 text-zinc-400">
                              {preset.mode === "dark" ? (
                                <Moon size={11} />
                              ) : (
                                <Sun size={11} />
                              )}
                            </span>
                          )}
                        </span>
                        <span className="block truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                          {preset.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <SectionLabel>Surface</SectionLabel>
              <div className="grid grid-cols-3 gap-2">
                {SURFACE_OPTIONS.map((opt) => {
                  const active = surface === opt.value;
                  const [page, card, line] = dark ? opt.dark : opt.light;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      aria-pressed={active}
                      title={opt.description}
                      onClick={() => update({ surface: opt.value })}
                      className={`${optionClass(active)} p-1.5`}
                    >
                      <span
                        aria-hidden
                        className="flex h-8 overflow-hidden rounded-md border"
                        style={{ borderColor: line }}
                      >
                        <span
                          className="flex-1"
                          style={{ backgroundColor: page }}
                        />
                        <span
                          className="flex-1"
                          style={{ backgroundColor: card }}
                        />
                        <span
                          className="flex-1"
                          style={{ backgroundColor: line }}
                        />
                      </span>
                      <span
                        className={[
                          "mt-1.5 block text-center text-xs font-medium",
                          active
                            ? "text-accent"
                            : "text-zinc-700 dark:text-zinc-300",
                        ].join(" ")}
                      >
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <SectionLabel>Accent</SectionLabel>
              <div className="grid grid-cols-7 gap-2 sm:grid-cols-9">
                {ACCENT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    title={opt.label}
                    aria-label={opt.label}
                    aria-pressed={accent === opt.value}
                    onClick={() => setAccent(opt.value as AccentColor)}
                    className={[
                      "relative flex aspect-square items-center justify-center rounded-full transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:focus-visible:ring-zinc-300",
                      accent === opt.value
                        ? "ring-2 ring-zinc-950/80 ring-offset-2 ring-offset-white dark:ring-white/80 dark:ring-offset-zinc-900"
                        : "",
                    ].join(" ")}
                    style={{ backgroundColor: opt.color }}
                  >
                    {accent === opt.value && (
                      <Check size={12} className="text-white" strokeWidth={3} />
                    )}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                {ACCENT_OPTIONS.find((o) => o.value === accent)?.label}
              </p>
            </div>
          </>
        )}

        {tab === "fonts" && (
          <div className="grid grid-cols-2 gap-2">
            {FONT_OPTIONS.map((opt) => {
              const active = font === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFont(opt.value as FontOption)}
                  className={`${optionClass(active)} p-3`}
                  style={{ fontFamily: opt.family }}
                >
                  <span
                    className={[
                      "block text-2xl leading-none font-semibold",
                      active
                        ? "text-accent"
                        : "text-zinc-950 dark:text-zinc-50",
                    ].join(" ")}
                  >
                    Aa
                  </span>
                  <span className="mt-2 block truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    {opt.label}
                  </span>
                  <span className="block truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                    {opt.description}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {tab === "layout" && (
          <>
            <div>
              <SectionLabel>Page width</SectionLabel>
              <div className="grid grid-cols-3 gap-2">
                {LAYOUT_OPTIONS.map((opt) => {
                  const active = layout === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      aria-pressed={active}
                      title={opt.description}
                      onClick={() => setLayout(opt.value as LayoutOption)}
                      className={`${optionClass(active)} p-2.5`}
                    >
                      <span className="flex h-12 flex-col justify-center gap-1 rounded-md bg-zinc-100 px-1 dark:bg-zinc-800">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className={[
                              "mx-auto h-1.5 rounded-full",
                              active
                                ? "bg-accent/70"
                                : "bg-zinc-300 dark:bg-zinc-600",
                            ].join(" ")}
                            style={{ width: LAYOUT_WIDTH[opt.value] }}
                          />
                        ))}
                      </span>
                      <span
                        className={[
                          "mt-2 block text-center text-xs font-medium",
                          active
                            ? "text-accent"
                            : "text-zinc-700 dark:text-zinc-300",
                        ].join(" ")}
                      >
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <SectionLabel>Corners</SectionLabel>
              <div className="grid grid-cols-3 gap-2">
                {RADIUS_OPTIONS.map((opt) => {
                  const active = radius === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setRadius(opt.value as RadiusOption)}
                      className={`${optionClass(active)} flex flex-col items-center p-2.5`}
                    >
                      <span
                        className={[
                          "h-10 w-14 border-2",
                          active
                            ? "border-accent bg-accent/10"
                            : "border-zinc-300 bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800",
                        ].join(" ")}
                        style={{ borderRadius: opt.preview }}
                      />
                      <span
                        className={[
                          "mt-2 text-xs font-medium",
                          active
                            ? "text-accent"
                            : "text-zinc-700 dark:text-zinc-300",
                        ].join(" ")}
                      >
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {tab === "layout" && (
          <>
            <div>
              <SectionLabel>Density</SectionLabel>
              <ChoiceRow
                options={DENSITY_OPTIONS}
                value={density}
                onChange={(v) => update({ density: v })}
                render={(opt, active) => (
                  <span
                    aria-hidden
                    className="flex h-7 w-10 flex-col justify-center"
                    style={{
                      gap:
                        opt.value === "compact"
                          ? 2
                          : opt.value === "cozy"
                            ? 4
                            : 6,
                    }}
                  >
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className={[
                          "h-1 rounded-full",
                          active
                            ? "bg-accent/70"
                            : "bg-zinc-300 dark:bg-zinc-600",
                        ].join(" ")}
                      />
                    ))}
                  </span>
                )}
              />
            </div>

            <div>
              <SectionLabel>Text size</SectionLabel>
              <ChoiceRow
                options={TEXT_SIZE_OPTIONS}
                value={textSize}
                onChange={(v) => update({ textSize: v })}
                render={(opt, active) => (
                  <span
                    aria-hidden
                    className={[
                      "flex h-7 items-end font-semibold leading-none",
                      active
                        ? "text-accent"
                        : "text-zinc-950 dark:text-zinc-50",
                    ].join(" ")}
                    style={{ fontSize: TEXT_PREVIEW[opt.value] }}
                  >
                    Aa
                  </span>
                )}
              />
            </div>

            <div>
              <SectionLabel>Motion</SectionLabel>
              <ChoiceRow
                options={MOTION_OPTIONS}
                value={motion}
                onChange={(v) => update({ motion: v })}
              />
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                {MOTION_OPTIONS.find((o) => o.value === motion)?.description}.
                Reduce turns off animations and smooth scrolling.
              </p>
            </div>
          </>
        )}

        {tab === "content" && (
          <div className="space-y-3">
            <div>
              <SectionLabel>Card stats</SectionLabel>
              <div className="grid grid-cols-2 gap-2">
                {CARD_STAT_OPTIONS.map((opt) => {
                  const on = !hiddenStats.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleStat(opt.value)}
                      className={`${optionClass(on)} flex items-start gap-2 p-2.5`}
                    >
                      <span
                        className={[
                          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                          on
                            ? "border-accent bg-accent text-accent-fg"
                            : "border-zinc-300 dark:border-zinc-600",
                        ].join(" ")}
                      >
                        {on && <Check size={11} strokeWidth={3} />}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-zinc-950 dark:text-zinc-50">
                          {opt.label}
                        </span>
                        <span className="block text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
                          {opt.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <HiddenTags />

            <Toggle
              title="Hide offline bots"
              description="Leaves out bots we've seen offline. Bots whose status we can't see still show."
              checked={hideOffline}
              onChange={(v) => update({ hideOffline: v })}
            />

            <label className="flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-zinc-200 px-3 py-2.5 dark:border-zinc-700">
              <span>
                <span className="block text-sm font-medium text-zinc-950 dark:text-zinc-50">
                  Hide NSFW content
                </span>
                <span className="block text-xs text-zinc-400 dark:text-zinc-500">
                  Removes bots and servers flagged NSFW from browse, search, and
                  profile listings. Doesn&apos;t block a page you link to
                  directly.
                </span>
              </span>
              <input
                type="checkbox"
                checked={hideNsfw}
                onChange={(e) => setHideNsfw(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-300 accent-accent dark:border-zinc-600"
              />
            </label>

            <label
              className={[
                "flex items-start justify-between gap-3 rounded-xl border px-3 py-2.5",
                hideNsfw
                  ? "cursor-not-allowed border-zinc-200 opacity-50 dark:border-zinc-700"
                  : "cursor-pointer border-zinc-200 dark:border-zinc-700",
              ].join(" ")}
            >
              <span>
                <span className="block text-sm font-medium text-zinc-950 dark:text-zinc-50">
                  Blur NSFW thumbnails
                </span>
                <span className="block text-xs text-zinc-400 dark:text-zinc-500">
                  {hideNsfw
                    ? "Not applicable: NSFW content is already hidden above."
                    : "Blurs avatar/banner images on NSFW cards, not the surrounding text."}
                </span>
              </span>
              <input
                type="checkbox"
                checked={blurNsfw}
                disabled={hideNsfw}
                onChange={(e) => setBlurNsfw(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-300 accent-accent disabled:cursor-not-allowed dark:border-zinc-600"
              />
            </label>

            <p className="text-xs text-zinc-400 dark:text-zinc-600">
              Cookie controls aren&apos;t listed here. Omniplex doesn&apos;t set
              any analytics or tracking cookies to begin with, only the session
              cookie sign-in itself needs.
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-zinc-200 px-4 py-2.5 dark:border-zinc-800">
        <span className="inline-flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
          {sync === "account" || sync === "saving" ? (
            <Cloud size={12} />
          ) : (
            <CloudOff size={12} />
          )}
          {SYNC_LABELS[sync]}
        </span>
        <button
          type="button"
          onClick={() => {
            resetPrefs();
            setTheme("system");
          }}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
        >
          <RotateCcw size={12} />
          Reset to defaults
        </button>
      </div>
    </div>
  );
}
