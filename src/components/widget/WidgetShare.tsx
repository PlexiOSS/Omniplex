"use client";

import { Check, Code2, Copy, ExternalLink, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { ENTITY_ACTION_CLASS } from "@/components/ui/entityAction";
import { Modal } from "@/components/ui/Modal";
import { useCustomization } from "@/hooks/useCustomization";
import {
  ACCENT_COLORS,
  ACCENT_VALUES,
  type AccentColor,
  isAccentColor,
} from "@/lib/constants/accent";
import type { WidgetStatDef } from "@/lib/widget/shared";

interface WidgetShareProps {
  widgetPath: string;
  stats: WidgetStatDef[];
}

type Theme = "dark" | "light";
type Format = "markdown" | "html" | "url";

const FORMATS: { key: Format; label: string }[] = [
  { key: "markdown", label: "Markdown" },
  { key: "html", label: "HTML" },
  { key: "url", label: "Image URL" },
];

const SEGMENT =
  "inline-flex rounded-xl border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-950";

function segmentItem(active: boolean) {
  return [
    "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors",
    active
      ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
      : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
  ].join(" ");
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      {children}
    </div>
  );
}

function WidgetShareBody({ widgetPath, stats }: WidgetShareProps) {
  const { resolvedTheme } = useTheme();
  const { accent: siteAccent } = useCustomization();
  const [theme, setTheme] = useState<Theme>("dark");
  const [accent, setAccent] = useState<AccentColor>("indigo");
  const [format, setFormat] = useState<Format>("markdown");
  const [copied, setCopied] = useState(false);
  const [visibleStats, setVisibleStats] = useState(
    () => new Set(stats.map((s) => s.key)),
  );
  const synced = useRef(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (synced.current) return;
    if (resolvedTheme === "light" || resolvedTheme === "dark") {
      setTheme(resolvedTheme);
    }
    if (siteAccent && isAccentColor(siteAccent)) setAccent(siteAccent);
    synced.current = true;
  }, [resolvedTheme, siteAccent]);

  function toggleStat(key: string) {
    setVisibleStats((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const statsParam = stats
    .map((s) => s.key)
    .filter((key) => visibleStats.has(key))
    .join(",");
  const query = `theme=${theme}&accent=${accent}&stats=${statsParam}`;
  const previewSrc = `${widgetPath}?${query}`;
  const imageUrl = `${origin}${widgetPath}?${query}`;
  const pageUrl = `${origin}${widgetPath.replace(/\/widget$/, "")}`;

  const snippets: Record<Format, string> = {
    markdown: `[![Widget](${imageUrl})](${pageUrl})`,
    html: `<a href="${pageUrl}"><img src="${imageUrl}" alt="Widget" /></a>`,
    url: imageUrl,
  };

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippets[format]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_17rem]">
      <div className="min-w-0 space-y-4">
        <div
          className={[
            "flex min-h-56 items-center justify-center rounded-2xl border p-6",
            theme === "dark"
              ? "border-zinc-800 bg-zinc-950 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px]"
              : "border-zinc-200 bg-zinc-50 bg-[radial-gradient(#e4e4e7_1px,transparent_1px)] [background-size:16px_16px]",
          ].join(" ")}
        >
          {/* biome-ignore lint/performance/noImgElement: generated widget image */}
          <img
            key={previewSrc}
            src={previewSrc}
            alt="Widget preview"
            width={480}
            height={180}
            className="h-auto w-full max-w-md drop-shadow-xl"
          />
        </div>

        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div className={SEGMENT}>
              {FORMATS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFormat(key)}
                  aria-pressed={format === key}
                  className={segmentItem(format === key)}
                >
                  {label}
                </button>
              ))}
            </div>
            <a
              href={previewSrc}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 transition-colors hover:text-accent dark:text-zinc-400"
            >
              Open image <ExternalLink size={12} />
            </a>
          </div>
          <div className="relative">
            <pre className="max-h-32 overflow-auto rounded-xl border border-zinc-200 bg-zinc-50 p-3 pr-24 text-xs leading-relaxed whitespace-pre-wrap break-all text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
              {snippets[format]}
            </pre>
            <button
              type="button"
              onClick={copy}
              className="absolute top-2 right-2 inline-flex h-8 items-center gap-1.5 rounded-lg bg-accent px-3 text-xs font-medium text-accent-fg transition-opacity hover:opacity-90"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <Field label="Theme">
          <div className={SEGMENT}>
            <button
              type="button"
              onClick={() => setTheme("light")}
              aria-pressed={theme === "light"}
              className={segmentItem(theme === "light")}
            >
              <Sun size={13} />
              Light
            </button>
            <button
              type="button"
              onClick={() => setTheme("dark")}
              aria-pressed={theme === "dark"}
              className={segmentItem(theme === "dark")}
            >
              <Moon size={13} />
              Dark
            </button>
          </div>
        </Field>

        <Field label="Accent">
          <div className="flex flex-wrap gap-2">
            {ACCENT_VALUES.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setAccent(value)}
                aria-label={value}
                aria-pressed={accent === value}
                className={[
                  "h-7 w-7 rounded-full transition-transform hover:scale-110",
                  accent === value
                    ? "ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900"
                    : "ring-1 ring-black/5 dark:ring-white/10",
                ].join(" ")}
                style={
                  {
                    backgroundColor: ACCENT_COLORS[value],
                    "--tw-ring-color": ACCENT_COLORS[value],
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
        </Field>

        <Field label="Show">
          <div className="space-y-1.5">
            {stats.map(({ key, label }) => {
              const on = visibleStats.has(key);
              return (
                <label
                  key={key}
                  className={[
                    "flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm transition-colors",
                    on
                      ? "border-accent/40 bg-accent/5 text-zinc-900 dark:text-zinc-100"
                      : "border-zinc-200 text-zinc-500 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700",
                  ].join(" ")}
                >
                  {label}
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => toggleStat(key)}
                    className="h-4 w-4 rounded border-zinc-300 accent-accent dark:border-zinc-700"
                  />
                </label>
              );
            })}
          </div>
        </Field>
      </div>
    </div>
  );
}

export function WidgetShare({ widgetPath, stats }: WidgetShareProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={ENTITY_ACTION_CLASS}
      >
        <Code2 size={13} />
        Embed
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Embed a widget"
        size="lg"
      >
        <WidgetShareBody widgetPath={widgetPath} stats={stats} />
      </Modal>
    </>
  );
}
