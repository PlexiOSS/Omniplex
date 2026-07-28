"use client";

import { Check, Copy, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import {
  ACCENT_COLORS,
  ACCENT_VALUES,
  type AccentColor,
} from "@/lib/constants/accent";

interface WidgetShareProps {
  /** Path to the widget route, e.g. "/bots/lurifix/widget" */
  widgetPath: string;
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
    <div className="flex items-center gap-2">
      <code className="min-w-0 flex-1 truncate rounded-lg bg-zinc-100 px-2.5 py-1.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
        {value}
      </code>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={`Copy ${label}`}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
      >
        {copied ? (
          <Check size={14} className="text-accent" />
        ) : (
          <Copy size={14} />
        )}
      </button>
    </div>
  );
}

export function WidgetShare({ widgetPath }: WidgetShareProps) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [accent, setAccent] = useState<AccentColor>("indigo");
  const [format, setFormat] = useState<Format>("markdown");

  // Server and the first client render must produce identical markup, so
  // `origin` starts empty (matching SSR, where `window` doesn't exist) and
  // is only filled in after mount — never branch on `typeof window` inline
  // in render, that's a guaranteed hydration mismatch.
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const query = `theme=${theme}&accent=${accent}`;
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
    <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <h3 className="mb-3 text-sm font-medium text-zinc-950 dark:text-zinc-50">
        Widget
      </h3>

      {/* Preview */}
      <a
        href={previewSrc}
        target="_blank"
        rel="noopener noreferrer"
        className="group block overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800"
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
        <span className="flex items-center justify-center gap-1.5 border-t border-zinc-200 py-1.5 text-xs font-medium text-zinc-500 transition-colors group-hover:text-accent dark:border-zinc-800 dark:text-zinc-400">
          Open full size
          <ExternalLink size={11} />
        </span>
      </a>

      {/* Theme + accent controls */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
          {(["dark", "light"] as Theme[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTheme(t)}
              className={[
                "px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                theme === t
                  ? "bg-accent text-accent-fg"
                  : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800",
              ].join(" ")}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          {ACCENT_VALUES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setAccent(value)}
              aria-label={value}
              className={[
                "h-5 w-5 rounded-full transition-transform hover:scale-110",
                accent === value
                  ? "ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900"
                  : "",
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

      {/* Format tabs */}
      <div className="mt-4 flex gap-1 border-b border-zinc-200 dark:border-zinc-800">
        {FORMATS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFormat(key)}
            className={[
              "-mb-px border-b-2 px-2 pb-1.5 text-xs font-medium transition-colors",
              format === key
                ? "border-accent text-accent"
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="mt-3">
        <CopyRow label={format} value={snippets[format]} />
      </div>
    </div>
  );
}
