"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import {
  useCustomization,
  ACCENT_OPTIONS,
  FONT_OPTIONS,
  LAYOUT_OPTIONS,
  type AccentColor,
  type FontOption,
  type LayoutOption,
} from "@/hooks/useCustomization";

interface CustomizationPanelProps {
  open: boolean;
  onClose: () => void;
}

type Tab = "colors" | "fonts" | "layout" | "content";

const TABS: { key: Tab; label: string }[] = [
  { key: "colors", label: "Colors" },
  { key: "fonts", label: "Fonts" },
  { key: "layout", label: "Layout" },
  { key: "content", label: "Content" },
];

export function CustomizationPanel({ open, onClose }: CustomizationPanelProps) {
  const {
    accent,
    font,
    layout,
    hideNsfw,
    blurNsfw,
    setAccent,
    setFont,
    setLayout,
    setHideNsfw,
    setBlurNsfw,
  } = useCustomization();
  const panelRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<Tab>("colors");

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
          Customize
        </p>
        <button
          type="button"
          onClick={onClose}
          className="p-1 transition-colors rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
        >
          <X size={15} />
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 px-2 pt-2 border-b border-zinc-200 dark:border-zinc-800">
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

      <div className="p-4">
        {tab === "colors" && (
          <div>
            <div className="flex flex-wrap gap-2">
              {ACCENT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  title={opt.label}
                  onClick={() => setAccent(opt.value as AccentColor)}
                  className="relative transition-transform rounded-full group h-7 w-7 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:focus-visible:ring-zinc-300"
                  style={{ backgroundColor: opt.color }}
                >
                  {accent === opt.value && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="h-2.5 w-2.5 rounded-full bg-white opacity-90" />
                    </span>
                  )}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs capitalize text-zinc-400 dark:text-zinc-600">
              {ACCENT_OPTIONS.find((o) => o.value === accent)?.label}
            </p>
          </div>
        )}

        {tab === "fonts" && (
          <div className="space-y-1.5">
            {FONT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFont(opt.value as FontOption)}
                className={[
                  "flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition-colors",
                  font === opt.value
                    ? "border-accent bg-accent/5 text-accent"
                    : "border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800",
                ].join(" ")}
              >
                <span className="text-sm font-medium">{opt.label}</span>
                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                  {opt.description}
                </span>
              </button>
            ))}
          </div>
        )}

        {tab === "layout" && (
          <div className="space-y-1.5">
            {LAYOUT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setLayout(opt.value as LayoutOption)}
                className={[
                  "flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition-colors",
                  layout === opt.value
                    ? "border-accent bg-accent/5 text-accent"
                    : "border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800",
                ].join(" ")}
              >
                <span className="text-sm font-medium">{opt.label}</span>
                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                  {opt.description}
                </span>
              </button>
            ))}
          </div>
        )}

        {tab === "content" && (
          <div className="space-y-3">
            <label className="flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-zinc-200 px-3 py-2.5 dark:border-zinc-700">
              <span>
                <span className="block text-sm font-medium text-zinc-950 dark:text-zinc-50">
                  Hide NSFW content
                </span>
                <span className="block text-xs text-zinc-400 dark:text-zinc-500">
                  Removes bots and servers flagged NSFW from browse, search,
                  and profile listings. Doesn&apos;t block a page you link to
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
                    ? "Not applicable — NSFW content is already hidden above."
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
              Cookie controls aren&apos;t listed here. Omniplex doesn&apos;t
              set any analytics or tracking cookies to begin with, only the
              session cookie sign-in itself needs.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
