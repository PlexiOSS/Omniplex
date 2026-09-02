"use client";

import {
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  Moon,
  SlidersHorizontal,
  Sun,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  ACCENT_COLORS,
  ACCENT_VALUES,
  isAccentColor,
  type AccentColor,
} from "@/lib/constants/accent";
import type { WidgetStatDef } from "@/lib/widget/shared";
import { useCustomization } from "@/hooks/useCustomization";
import { useTheme } from "next-themes";

interface WidgetShareProps {
  /** Path to the widget route, e.g. "/bots/lurifix/widget" */
  widgetPath: string;
  /** Stat keys this widget type supports, e.g. BOT_WIDGET_STATS */
  stats: WidgetStatDef[];
}

type Theme = "dark" | "light";
type Format = "markdown" | "html" | "url";

const FORMATS: { key: Format; label: string }[] = [
  { key: "markdown", label: "Markdown" },
  { key: "html", label: "HTML" },
  { key: "url", label: "URL" },
];

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable — silently no-op
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-1 pl-3 dark:border-zinc-800 dark:bg-zinc-900">
      <code className="min-w-0 flex-1 truncate text-xs text-zinc-600 dark:text-zinc-400">
        {value}
      </code>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={`Copy ${label}`}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 shadow-sm transition-colors hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        {copied ? (
          <Check size={14} className="text-emerald-500" />
        ) : (
          <Copy size={14} />
        )}
      </button>
    </div>
  );
}

export function WidgetShare({ widgetPath, stats }: WidgetShareProps) {
  const { resolvedTheme } = useTheme();
  const { accent: siteAccent } = useCustomization();
  const [theme, setTheme] = useState<Theme>("dark");
  const [accent, setAccent] = useState<AccentColor>("indigo");
  const [format, setFormat] = useState<Format>("markdown");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [visibleStats, setVisibleStats] = useState(
    () => new Set(stats.map((s) => s.key)),
  );
  const hasSyncedAccent = useRef(false);
  const hasSyncedTheme = useRef(false);

  // Match site theme — initialise from next-themes + CustomizationProvider so
  // the widget preview mirrors the user's current site theme (accent + dark/light)
  // Only sync once on mount so manual widget picks aren't overridden
  useEffect(() => {
    if (!hasSyncedAccent.current && siteAccent && isAccentColor(siteAccent)) {
      setAccent(siteAccent);
      hasSyncedAccent.current = true;
    }
  }, [siteAccent]);

  useEffect(() => {
    if (
      !hasSyncedTheme.current &&
      (resolvedTheme === "light" || resolvedTheme === "dark")
    ) {
      setTheme(resolvedTheme);
      hasSyncedTheme.current = true;
    }
  }, [resolvedTheme]);

  function toggleStat(key: string) {
    setVisibleStats((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  // Server and the first client render must produce identical markup, so
  // `origin` starts empty (matching SSR, where `window` doesn't exist) and
  // is only filled in after mount — never branch on `typeof window` inline
  // in render, that's a guaranteed hydration mismatch.
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const statsParam = stats
    .map((s) => s.key)
    .filter((key) => visibleStats.has(key))
    .join(",");
  const query = `theme=${theme}&accent=${accent}&stats=${statsParam}`;
  // Relative — safe to use before `origin` is known, and works identically
  // once it's filled in (browsers resolve it against the current page).
  const previewSrc = `${widgetPath}?${query}`;
  const imageUrl = `${origin}${widgetPath}?${query}`;
  const pageUrl = `${origin}${widgetPath.replace(/\/widget$/, "")}`;

  const snippets: Record<Format, string> = {
    markdown: `[![Widget](${imageUrl})](${pageUrl})`,
    html: `<a href="${pageUrl}"><img src="${imageUrl}" alt="Widget" /></a>`,
    url: imageUrl,
  };

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
      {/* Header */}
      <div className="px-4 pt-4">
        <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
          Widget
        </h3>
      </div>

      {/* Preview */}
      <div className="p-4">
        <a
          href={previewSrc}
          target="_blank"
          rel="noopener noreferrer"
          className="group block overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={previewSrc}
            src={previewSrc}
            alt="Widget preview"
            width={480}
            height={180}
            className="block h-auto w-full"
          />
          <span className="flex items-center justify-center gap-1.5 border-t border-zinc-200 bg-white py-2 text-xs font-medium text-zinc-500 transition-colors group-hover:text-accent dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
            Open full size
            <ExternalLink size={11} />
          </span>
        </a>
      </div>

      {/* Controls */}
      <div className="space-y-3 px-4 pb-4">
        {/* Theme — always visible */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Theme
          </span>
          <div className="inline-flex rounded-full bg-zinc-100 p-1 dark:bg-zinc-800">
            <button
              type="button"
              onClick={() => setTheme("light")}
              aria-label="Light theme"
              aria-pressed={theme === "light"}
              className={[
                "inline-flex h-7 w-7 items-center justify-center rounded-full transition-all",
                theme === "light"
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50"
                  : "text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300",
              ].join(" ")}
            >
              <Sun size={14} />
            </button>
            <button
              type="button"
              onClick={() => setTheme("dark")}
              aria-label="Dark theme"
              aria-pressed={theme === "dark"}
              className={[
                "inline-flex h-7 w-7 items-center justify-center rounded-full transition-all",
                theme === "dark"
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50"
                  : "text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300",
              ].join(" ")}
            >
              <Moon size={14} />
            </button>
          </div>
        </div>

        {/* Advanced — accent + display */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            aria-expanded={showAdvanced}
            className="flex w-full items-center justify-between rounded-lg px-1 py-1 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <span className="flex items-center gap-1.5">
              <SlidersHorizontal size={12} />
              Advanced
              {!showAdvanced && (accent !== "indigo" || visibleStats.size !== stats.length) && (
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              )}
            </span>
            <ChevronDown
              size={14}
              className={`transition-transform ${showAdvanced ? "rotate-180" : ""}`}
            />
          </button>

          {showAdvanced && (
            <div className="mt-2 space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-transparent">
              <div className="space-y-2">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Accent
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {ACCENT_VALUES.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setAccent(value)}
                      aria-label={value}
                      aria-pressed={accent === value}
                      className={[
                        "h-6 w-6 shrink-0 rounded-full transition-all hover:scale-105",
                        accent === value
                          ? "ring-2 ring-offset-2 ring-offset-zinc-50 dark:ring-offset-zinc-800"
                          : "ring-1 ring-black/5 dark:ring-white/10",
                      ].join(" ")}
                      style={{
                        backgroundColor: ACCENT_COLORS[value],
                        ...(accent === value
                          ? ({
                              "--tw-ring-color": ACCENT_COLORS[value],
                            } as React.CSSProperties)
                          : {}),
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="h-px bg-zinc-200 dark:bg-zinc-700/50" />

              <div className="space-y-2">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Display
                </span>
                <div className="flex flex-wrap gap-2">
                  {stats.map(({ key, label }) => {
                    const active = visibleStats.has(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleStat(key)}
                        aria-pressed={active}
                        className={[
                          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                          active
                            ? "border-accent bg-accent text-accent-fg"
                            : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-200",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "h-1.5 w-1.5 rounded-full transition-colors",
                            active
                              ? "bg-accent-fg"
                              : "bg-zinc-300 dark:bg-zinc-600",
                          ].join(" ")}
                        />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="h-px bg-zinc-100 dark:bg-zinc-800" />

        {/* Format + copy — always visible */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Embed
            </span>
            <div className="inline-flex rounded-full bg-zinc-100 p-1 dark:bg-zinc-800">
              {FORMATS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFormat(key)}
                  aria-pressed={format === key}
                  className={[
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    format === key
                      ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50"
                      : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200",
                  ].join(" ")}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <CopyRow label={format} value={snippets[format]} />
        </div>
      </div>
    </div>
  );
}
