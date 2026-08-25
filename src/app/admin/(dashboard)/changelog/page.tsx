"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AdminEmptyState, AdminListRow } from "@/components/admin/AdminListRow";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type { ChangelogEntry } from "@/lib/arcadia/types";
import { useAdmin } from "../../AdminContext";
import { AdminPageHeader } from "../../AdminPageHeader";
import { ChangelogEditModal } from "./ChangelogEditModal";

const PROJECT_LABEL: Record<string, string> = {
  popplio: "Popplio",
  omniplex: "Omniplex",
};

export default function ChangelogAdminPage() {
  const { loginToken, hasPerm } = useAdmin();

  const [entries, setEntries] = useState<ChangelogEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ChangelogEntry | "new" | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDeleteItag, setConfirmDeleteItag] = useState<string | null>(
    null,
  );
  const confirmRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    try {
      setEntries(await arcadia.changelog.list(loginToken));
    } catch (err) {
      setError(
        err instanceof ArcadiaError ? err.message : "Failed to load entries.",
      );
    }
  }, [loginToken]);

  useEffect(() => {
    load();
  }, [load]);

  function handleDeleteClick(itag: string) {
    if (confirmDeleteItag !== itag) {
      setConfirmDeleteItag(itag);
      confirmRef.current = setTimeout(() => setConfirmDeleteItag(null), 3000);
      return;
    }
    if (confirmRef.current) clearTimeout(confirmRef.current);
    setConfirmDeleteItag(null);
    setDeleting(itag);
    arcadia.changelog
      .delete(loginToken, itag)
      .then(load)
      .catch((err) =>
        setError(
          err instanceof ArcadiaError ? err.message : "Failed to delete.",
        ),
      )
      .finally(() => setDeleting(null));
  }

  if (error && !entries) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!entries) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-50" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <AdminPageHeader
        title="Changelog"
        description={
          <>
            Curated release entries shown on the public <code>/changelog</code>{" "}
            page, for both Popplio and Omniplex.
          </>
        }
        action={
          hasPerm("manage_changelog") && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setEditing("new")}
            >
              <Plus size={14} />
              New Entry
            </Button>
          )
        }
      />

      {error && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="mt-6 space-y-2">
        {entries.length === 0 && (
          <AdminEmptyState message="No changelog entries yet." />
        )}
        {entries.map((entry) => (
          <AdminListRow
            key={entry.itag}
            actions={
              hasPerm("manage_changelog") && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditing(entry)}
                  >
                    <Pencil size={12} />
                  </Button>
                  <Button
                    variant={
                      confirmDeleteItag === entry.itag ? "danger" : "ghost"
                    }
                    size="sm"
                    loading={deleting === entry.itag}
                    onClick={() => handleDeleteClick(entry.itag)}
                  >
                    <Trash2 size={12} />
                  </Button>
                </>
              )
            }
          >
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="info">
                {PROJECT_LABEL[entry.project] ?? entry.project}
              </Badge>
              <span className="font-semibold text-zinc-950 dark:text-zinc-50">
                {entry.version}
              </span>
              {entry.prerelease && <Badge variant="warning">Prerelease</Badge>}
              {!entry.published && <Badge variant="warning">Draft</Badge>}
            </div>
            {entry.extra_description && (
              <p className="mt-0.5 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
                {entry.extra_description}
              </p>
            )}
            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-600">
              {entry.added.length} added · {entry.updated.length} updated ·{" "}
              {entry.removed.length} removed
            </p>
          </AdminListRow>
        ))}
      </div>

      {editing === "new" && (
        <ChangelogEditModal
          loginToken={loginToken}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}
      {editing && editing !== "new" && (
        <ChangelogEditModal
          loginToken={loginToken}
          entry={editing}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
