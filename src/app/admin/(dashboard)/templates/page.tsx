"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type { StaffTemplateUpsert } from "@/lib/arcadia/types";
import { AdminListRow, AdminEmptyState } from "@/components/admin/AdminListRow";
import { AdminPageHeader } from "../../AdminPageHeader";
import { useAdmin } from "../../AdminContext";
import { TemplateEditModal } from "./TemplateEditModal";

type EntityFilter = "all" | "bot" | "server";

export default function StaffTemplatesPage() {
  const { loginToken, hasPerm } = useAdmin();

  const [templates, setTemplates] = useState<StaffTemplateUpsert[] | null>(
    null,
  );
  const [filter, setFilter] = useState<EntityFilter>("all");
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<StaffTemplateUpsert | "new" | null>(
    null,
  );
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const confirmRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    try {
      setTemplates(await arcadia.staffTemplates.list(loginToken));
    } catch (err) {
      setError(
        err instanceof ArcadiaError
          ? err.message
          : "Failed to load templates.",
      );
    }
  }, [loginToken]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(
    () =>
      templates?.filter((t) => filter === "all" || t.entity_type === filter),
    [templates, filter],
  );

  function handleDeleteClick(id: string) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      confirmRef.current = setTimeout(() => setConfirmDeleteId(null), 3000);
      return;
    }
    if (confirmRef.current) clearTimeout(confirmRef.current);
    setConfirmDeleteId(null);
    setDeleting(id);
    arcadia.staffTemplates
      .delete(loginToken, id)
      .then(load)
      .catch((err) =>
        setError(
          err instanceof ArcadiaError ? err.message : "Failed to delete.",
        ),
      )
      .finally(() => setDeleting(null));
  }

  if (error && !templates) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-center px-4 py-24 text-center"><p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!templates) {
    return (
      <div className="mx-auto flex max-w-5xl justify-center px-4 py-24"><div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-50" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <AdminPageHeader
        title="Templates"
        description="Pre-built answers staff pick from when approving, denying, or otherwise reviewing a bot or server."
        action={
          hasPerm("manage_templates") && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setEditing("new")}
            >
              <Plus size={14} />
              New Template
            </Button>
          )
        }
      />

      <div className="mt-6 flex items-center gap-1">
        {(["all", "bot", "server"] as EntityFilter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={[
              "rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors",
              filter === f
                ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
            ].join(" ")}
          >
            {f === "all" ? "All" : `${f}s`}
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="mt-6 space-y-2">
        {visible?.length === 0 && (
          <AdminEmptyState message="No templates yet." />
        )}
        {visible?.map((template) => (
          <AdminListRow
            key={template.id}
            actions={
              hasPerm("manage_templates") && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditing(template)}
                  >
                    <Pencil size={12} />
                  </Button>
                  <Button
                    variant={
                      confirmDeleteId === template.id ? "danger" : "ghost"
                    }
                    size="sm"
                    loading={deleting === template.id}
                    onClick={() => handleDeleteClick(template.id)}
                  >
                    <Trash2 size={12} />
                  </Button>
                </>
              )
            }
          >
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                {template.emoji} {template.name}
              </span>
              <Badge>{template.entity_type}</Badge>
              {template.type && <Badge>{template.type}</Badge>}
              {template.tags.map((t) => (
                <Badge key={t}>{t}</Badge>
              ))}
            </div>
            <p className="mt-0.5 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
              {template.description}
            </p>
          </AdminListRow>
        ))}
      </div>

      {editing === "new" && (
        <TemplateEditModal
          loginToken={loginToken}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}
      {editing && editing !== "new" && (
        <TemplateEditModal
          loginToken={loginToken}
          template={editing}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
