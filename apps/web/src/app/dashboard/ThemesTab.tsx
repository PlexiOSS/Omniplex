"use client";

import { themes } from "@omniplex/core/api";
import type { Theme } from "@omniplex/core/api/types";
import { formatRelativeTime } from "@omniplex/core/utils/format";
import { Avatar } from "@omniplex/ui/Avatar";
import { Button } from "@omniplex/ui/Button";
import { ArrowUpRight, Check, Copy, Palette, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

function textOn(hex: string): string {
  const c = hex.replace("#", "");
  if (c.length !== 6) return "#ffffff";
  const [r, g, b] = [0, 2, 4].map((i) =>
    Number.parseInt(c.slice(i, i + 2), 16),
  );
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#09090b" : "#ffffff";
}

function Swatch({ label, color }: { label: string; color: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      title={`Copy ${label.toLowerCase()} colour`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(color);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {}
      }}
      className="group flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-zinc-200 px-2 py-1.5 text-left transition-colors hover:border-accent/40 dark:border-zinc-800"
    >
      <span
        className="size-5 shrink-0 rounded-md ring-1 ring-black/10 dark:ring-white/10"
        style={{ backgroundColor: color }}
      />
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] uppercase tracking-wide text-zinc-400">
          {label}
        </span>
        <span className="block truncate font-mono text-xs text-zinc-700 dark:text-zinc-300">
          {color}
        </span>
      </span>
      {copied ? (
        <Check size={12} className="shrink-0 text-emerald-500" />
      ) : (
        <Copy
          size={12}
          className="shrink-0 text-zinc-300 opacity-0 transition-opacity group-hover:opacity-100 dark:text-zinc-600"
        />
      )}
    </button>
  );
}

function ThemeCard({
  theme,
  userId,
  token,
  mutate,
}: {
  theme: Theme;
  userId: string;
  token: string;
  mutate: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const confirmRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ink = textOn(theme.primary_color);

  function handleDelete() {
    if (!confirming) {
      setConfirming(true);
      confirmRef.current = setTimeout(() => setConfirming(false), 3000);
      return;
    }
    if (confirmRef.current) clearTimeout(confirmRef.current);
    setConfirming(false);
    setDeleting(true);
    themes
      .delete(userId, theme.id, token)
      .then(() => mutate())
      .catch(() => setDeleting(false));
  }

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <Link
        href={`/themes/${theme.id}`}
        aria-label={`View ${theme.name}`}
        className="relative block h-28 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, ${theme.primary_color}, ${theme.secondary_color})`,
        }}
      >
        <span
          className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full py-1 pr-3 pl-1 text-xs font-medium shadow-sm backdrop-blur-sm"
          style={{
            backgroundColor: `${theme.secondary_color}cc`,
            color: textOn(theme.secondary_color),
          }}
        >
          <Avatar
            src={theme.owner.avatar}
            alt={theme.owner.username}
            size={20}
          />
          {theme.owner.display_name || theme.owner.username}
        </span>
        <span
          className="absolute top-3 right-3 rounded-full px-2 py-0.5 text-[11px] font-medium opacity-80"
          style={{ color: ink }}
        >
          Preview
          <ArrowUpRight size={11} className="ml-0.5 inline" />
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 truncate font-semibold text-zinc-950 dark:text-zinc-50">
            {theme.name}
          </h3>
          <span className="shrink-0 text-xs text-zinc-400">
            {formatRelativeTime(theme.created_at)}
          </span>
        </div>
        {theme.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {theme.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="mt-3 flex gap-2">
          <Swatch label="Primary" color={theme.primary_color} />
          <Swatch label="Secondary" color={theme.secondary_color} />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-zinc-100 px-4 py-2 dark:border-zinc-800">
        <Link
          href={`/themes/${theme.id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-zinc-600 hover:text-accent dark:text-zinc-300"
        >
          View
          <ArrowUpRight size={13} />
        </Link>
        <Button
          variant={confirming ? "danger" : "ghost"}
          size="sm"
          loading={deleting}
          onClick={handleDelete}
          className="h-7 px-2 text-xs"
        >
          <Trash2 size={12} />
          {confirming ? "Delete?" : "Delete"}
        </Button>
      </div>
    </article>
  );
}

export function ThemesTab({
  themes: themeList,
  userId,
  token,
  mutate,
}: {
  themes: Theme[];
  userId: string;
  token: string;
  mutate: () => void;
}) {
  const sorted = themeList
    .slice()
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {themeList.length} {themeList.length === 1 ? "theme" : "themes"}
        </p>
        <Link href="/themes/add">
          <Button variant="secondary" size="sm">
            <Plus size={14} />
            Submit theme
          </Button>
        </Link>
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 py-14 text-center dark:border-zinc-800">
          <span className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-accent/10 text-accent ring-1 ring-accent/15">
            <Palette size={22} />
          </span>
          <p className="font-medium text-zinc-950 dark:text-zinc-50">
            No themes yet
          </p>
          <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
            Pick two colours and share a Discord profile theme with the
            community.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sorted.map((theme) => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              userId={userId}
              token={token}
              mutate={mutate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
