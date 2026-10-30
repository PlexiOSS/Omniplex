"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AdminEmptyState, AdminListRow } from "@/components/admin/AdminListRow";
import { AdminError, AdminLoading } from "@/components/admin/AdminState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type { ChangelogEntry } from "@/lib/arcadia/types";
import { changelogLabel } from "@/lib/changelog";
import { useAdmin } from "../../AdminContext";
import { AdminPageHeader } from "../../AdminPageHeader";

export default function ChangelogAdminPage() {
  const router = useRouter();
  const { loginToken, hasPerm } = useAdmin();

  const [entries, setEntries] = useState<ChangelogEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
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

  if (error && !entries)
    return (
      <AdminError
        message={error}
        onRetry={() => {
          setError(null);
          load();
        }}
      />
    );

  if (!entries) return <AdminLoading />;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
      <AdminPageHeader
        title="Changelog"
        description={
          <>
            Curated release entries shown on the public <code>/changelog</code>{" "}
            page, for Popplio, Omniplex, and Keel.
          </>
        }
        action={
          hasPerm("manage_changelog") && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => router.push("/admin/changelog/new")}
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

      <div className="mt-6 divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
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
                    onClick={() =>
                      router.push(
                        `/admin/changelog/${encodeURIComponent(entry.itag)}`,
                      )
                    }
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
                {changelogLabel(entry.project, entry.package)}
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
              {entry.fixed.length} fixed · {entry.removed.length} removed
              {entry.security?.length
                ? ` · ${entry.security.length} security`
                : ""}
            </p>
          </AdminListRow>
        ))}
      </div>
    </div>
  );
}
