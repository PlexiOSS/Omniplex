"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type { BadgeCatalogEntry } from "@/lib/arcadia/types";
import { badgeIcon } from "@/lib/constants/badgeIcons";
import { useAdmin } from "../../AdminContext";
import { AdminPageHeader } from "../../AdminPageHeader";
import { BadgeEditModal } from "./BadgeEditModal";

export default function BadgesPage() {
  const { loginToken, hasPerm } = useAdmin();

  const [badges, setBadges] = useState<BadgeCatalogEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<BadgeCatalogEntry | "new" | null>(
    null,
  );
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const confirmRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    try {
      setBadges(await arcadia.badges.list(loginToken));
    } catch (err) {
      setError(
        err instanceof ArcadiaError ? err.message : "Failed to load badges.",
      );
    }
  }, [loginToken]);

  useEffect(() => {
    load();
  }, [load]);

  function handleDeleteClick(id: string) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      confirmRef.current = setTimeout(() => setConfirmDeleteId(null), 3000);
      return;
    }
    if (confirmRef.current) clearTimeout(confirmRef.current);
    setConfirmDeleteId(null);
    setDeleting(id);
    arcadia.badges
      .delete(loginToken, id)
      .then(load)
      .catch((err) =>
        setError(
          err instanceof ArcadiaError ? err.message : "Failed to delete.",
        ),
      )
      .finally(() => setDeleting(null));
  }

  if (error && !badges) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!badges) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-50" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <AdminPageHeader
        title="Badges"
        description="The catalog of purely decorative badges award one to a user, bot, server, or team from its Actions menu in Search or Report detail."
        action={
          hasPerm("manage_badges") && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setEditing("new")}
            >
              <Plus size={14} />
              New Badge
            </Button>
          )
        }
      />

      {error && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="mt-6 space-y-2">
        {badges.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No badges yet.
          </p>
        )}
        {badges.map((badge) => {
          const Icon = badgeIcon(badge.icon);
          return (
            <div
              key={badge.id}
              className="flex items-center gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant={badge.color}>
                    <Icon size={12} />
                    {badge.name}
                  </Badge>
                  <span className="text-xs text-zinc-400 dark:text-zinc-600">
                    {badge.id}
                  </span>
                  {badge.target_types.map((t) => (
                    <Badge key={t}>{t}</Badge>
                  ))}
                </div>
                <p className="mt-0.5 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
                  {badge.description}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {hasPerm("manage_badges") && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditing(badge)}
                    >
                      <Pencil size={12} />
                    </Button>
                    <Button
                      variant={
                        confirmDeleteId === badge.id ? "danger" : "ghost"
                      }
                      size="sm"
                      loading={deleting === badge.id}
                      onClick={() => handleDeleteClick(badge.id)}
                    >
                      <Trash2 size={12} />
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {editing === "new" && (
        <BadgeEditModal
          loginToken={loginToken}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}
      {editing && editing !== "new" && (
        <BadgeEditModal
          loginToken={loginToken}
          badge={editing}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
