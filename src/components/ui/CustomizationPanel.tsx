"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import {
  useCustomization,
  ACCENT_OPTIONS,
  FONT_OPTIONS,
  type AccentColor,
  type FontOption,
} from "@/hooks/useCustomization";

interface CustomizationPanelProps {
  open: boolean;
  onClose: () => void;
}

export function CustomizationPanel({ open, onClose }: CustomizationPanelProps) {
  const { accent, font, setAccent, setFont } = useCustomization();
  const panelRef = useRef<HTMLDivElement>(null);

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
    <div className="fixed inset-0 z-50 flex items-start justify-end pt-16 pr-4 sm:pr-6">
      <div
        ref={panelRef}
        className="w-72 rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
            Customize
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            <X size={15} />
          </button>
        </div>

        <div className="space-y-5 p-4">
          {/* Accent Color */}
          <div>
            <p className="mb-2.5 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Accent Color
            </p>
            <div className="flex flex-wrap gap-2">
              {ACCENT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  title={opt.label}
                  onClick={() => setAccent(opt.value as AccentColor)}
                  className="group relative h-7 w-7 rounded-full transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:focus-visible:ring-zinc-300"
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
            <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-600 capitalize">
              {ACCENT_OPTIONS.find((o) => o.value === accent)?.label}
            </p>
          </div>

          {/* Font */}
          <div>
            <p className="mb-2.5 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Font
            </p>
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
                      : "border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800",
                  ].join(" ")}
                >
                  <span className="text-sm font-medium">{opt.label}</span>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">
                    {opt.description}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
