"use client";

import { pageStyles } from "@omniplex/core/api";
import { ApiError } from "@omniplex/core/api/client";
import { Button } from "@omniplex/ui/Button";
import { Check, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { FormMessage, SettingsCard } from "@/app/dashboard/manage/ManageShell";

const SWATCHES = [
  "#5865f2",
  "#6366f1",
  "#a855f7",
  "#ec4899",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#10b981",
  "#06b6d4",
  "#3b82f6",
];

interface CardThemeCardProps {
  target: "bot" | "server";
  id: string;
  owned: boolean;
  color: string | null | undefined;
  token: string;
  onSaved: () => void;
}

export function CardThemeCard({
  target,
  id,
  owned,
  color,
  token,
  onSaved,
}: CardThemeCardProps) {
  const [value, setValue] = useState(color ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const dirty = value !== (color ?? "");

  async function save(next = value) {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await pageStyles.setCardColor(target, id, next, token);
      setValue(next);
      setSaved(true);
      onSaved();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Couldn't save the colour.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!owned) {
    return (
      <SettingsCard
        title="Card theme"
        description={`Tint this ${target}'s card with your own colour everywhere it appears. Card Theme is in the shop.`}
        footer={
          <Link
            href={`/shop/items?${target}=${id}`}
            className="text-sm font-medium text-accent hover:underline"
          >
            Get Card Theme
          </Link>
        }
      />
    );
  }

  return (
    <SettingsCard
      title="Card theme"
      description={`Tints this ${target}'s card everywhere it appears. Leave it on Default for the standard look.`}
      footer={
        <>
          <FormMessage
            error={error}
            success={saved && !dirty ? "Saved." : null}
          />
          {value && (
            <Button
              variant="ghost"
              size="sm"
              disabled={saving}
              onClick={() => save("")}
            >
              <RotateCcw size={14} />
              Reset
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            loading={saving}
            disabled={!dirty}
            onClick={() => save()}
          >
            Save
          </Button>
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-1.5">
        {SWATCHES.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={c}
            aria-pressed={value === c}
            onClick={() => setValue(c)}
            className="flex size-7 items-center justify-center rounded-full"
            style={{ backgroundColor: c }}
          >
            {value === c && (
              <Check size={13} strokeWidth={3} className="text-white" />
            )}
          </button>
        ))}
        <input
          type="color"
          value={value || "#5865f2"}
          onChange={(e) => setValue(e.target.value.toLowerCase())}
          aria-label="Pick a custom card colour"
          className="size-8 cursor-pointer rounded-lg border border-zinc-200 bg-transparent p-0.5 dark:border-zinc-800"
        />
        <span className="ml-1 font-mono text-xs text-zinc-500 dark:text-zinc-400">
          {value || "Default"}
        </span>
      </div>
      <div
        className="flex items-center gap-3 rounded-xl border p-3"
        style={
          value
            ? {
                borderColor: `${value}66`,
                backgroundImage: `linear-gradient(135deg, ${value}26, transparent 70%)`,
              }
            : undefined
        }
      >
        <span
          className="size-9 shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-700"
          style={value ? { backgroundColor: value } : undefined}
        />
        <span className="min-w-0 flex-1">
          <span className="block h-2.5 w-28 rounded-full bg-zinc-300 dark:bg-zinc-600" />
          <span className="mt-1.5 block h-2 w-44 max-w-full rounded-full bg-zinc-200 dark:bg-zinc-700" />
        </span>
      </div>
    </SettingsCard>
  );
}
