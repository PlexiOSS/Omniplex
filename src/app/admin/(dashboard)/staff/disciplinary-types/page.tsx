"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { staff } from "@/lib/api";
import type { PermissionData } from "@/lib/api/types";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type { StaffDisciplinaryType } from "@/lib/arcadia/types";
import { AdminPageHeader } from "../../../AdminPageHeader";
import { useAdmin } from "../../../AdminContext";
import { DisciplinaryTypeEditModal } from "./DisciplinaryTypeEditModal";

export default function DisciplinaryTypesPage() {
  const { loginToken, staffMember, hasPerm } = useAdmin();

  const [types, setTypes] = useState<StaffDisciplinaryType[] | null>(null);
  const [catalog, setCatalog] = useState<PermissionData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<StaffDisciplinaryType | "new" | null>(
    null,
  );
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const confirmRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    try {
      const [list, cat] = await Promise.all([
        arcadia.staffDisciplinaryTypes.list(loginToken),
        staff.getPermissionCatalog(),
      ]);
      setTypes(list);
      setCatalog(cat.perms);
    } catch (err) {
      setError(
        err instanceof ArcadiaError
          ? err.message
          : "Failed to load disciplinary types.",
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
    arcadia.staffDisciplinaryTypes
      .delete(loginToken, id)
      .then(load)
      .catch((err) =>
        setError(
          err instanceof ArcadiaError ? err.message : "Failed to delete.",
        ),
      )
      .finally(() => setDeleting(null));
  }

  if (error && !types) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!types) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-50" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <AdminPageHeader
        title="Disciplinary Types"
        description="Templates for staff warnings/suspensions — self-assignable severity, the permissions they limit a member to, and whether they need approval before taking effect."
        action={
          hasPerm("manage_disciplinaries") && (
            <Button variant="primary" size="sm" onClick={() => setEditing("new")}>
              <Plus size={14} />
              New Type
            </Button>
          )
        }
      />

      {error && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="mt-6 space-y-2">
        {types.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No disciplinary types yet.
          </p>
        )}
        {types.map((type) => (
          <div
            key={type.id}
            className="flex items-center gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-semibold text-zinc-950 dark:text-zinc-50">
                  {type.name}
                </span>
                {type.self_assignable && (
                  <Badge variant="info">Self-assignable</Badge>
                )}
                {type.additory && <Badge>Additory</Badge>}
                {type.needs_approval && (
                  <Badge variant="warning">Needs approval</Badge>
                )}
              </div>
              <p className="mt-0.5 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
                {type.description}
              </p>
              <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-600">
                {type.perm_limits.length} permission
                {type.perm_limits.length === 1 ? "" : "s"} limited
                {type.max_expiry != null &&
                  ` · expires after ${Math.round(type.max_expiry / 3600)}h`}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {hasPerm("manage_disciplinaries") && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditing(type)}
                  >
                    <Pencil size={12} />
                  </Button>
                  <Button
                    variant={
                      confirmDeleteId === type.id ? "danger" : "ghost"
                    }
                    size="sm"
                    loading={deleting === type.id}
                    onClick={() => handleDeleteClick(type.id)}
                  >
                    <Trash2 size={12} />
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {editing === "new" && (
        <DisciplinaryTypeEditModal
          loginToken={loginToken}
          granterPerms={staffMember.resolved_perms}
          catalog={catalog}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}
      {editing && editing !== "new" && (
        <DisciplinaryTypeEditModal
          loginToken={loginToken}
          granterPerms={staffMember.resolved_perms}
          catalog={catalog}
          type={editing}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
