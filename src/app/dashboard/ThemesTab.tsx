"use client";

import { ArrowUpRight, Palette, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { ThemePreviewCard } from "@/components/themes/ThemePreviewCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { themes } from "@/lib/api";
import type { Theme } from "@/lib/api/types";

function ThemeItem({
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

  function handleDeleteClick() {
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
    <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <ThemePreviewCard
        primaryColor={theme.primary_color}
        secondaryColor={theme.secondary_color}
        compact
      />
      <div className="flex flex-1 flex-col p-4">
        <p className="truncate font-semibold text-zinc-950 dark:text-zinc-50">
          {theme.name}
        </p>

        {theme.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {theme.tags.slice(0, 4).map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between pt-3 text-xs text-zinc-500 dark:text-zinc-400">
          <Link
            href={`/themes/${theme.id}`}
            className="inline-flex items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            View
            <ArrowUpRight size={11} />
          </Link>
          <Button
            variant={confirming ? "danger" : "ghost"}
            size="sm"
            loading={deleting}
            onClick={handleDeleteClick}
            className="h-7 px-2 text-xs"
          >
            <Trash2 size={12} />
            {confirming ? "Confirm?" : "Delete"}
          </Button>
        </div>
      </div>
    </div>
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
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {themeList.length} {themeList.length === 1 ? "theme" : "themes"}
        </p>
        <Link href="/themes/add">
          <Button variant="secondary" size="sm">
            Submit Theme
          </Button>
        </Link>
      </div>

      {themeList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Palette
            size={32}
            className="mb-3 text-zinc-300 dark:text-zinc-700"
          />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            You haven&apos;t submitted any themes yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {themeList.map((theme) => (
            <ThemeItem
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
