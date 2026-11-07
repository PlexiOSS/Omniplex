"use client";

import { staff } from "@omniplex/core/api";
import type { PermissionData } from "@omniplex/core/api/types";
import { Badge } from "@omniplex/ui/Badge";
import { Button } from "@omniplex/ui/Button";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { DisciplinaryTypeEditModal } from "@/app/(dashboard)/staff/disciplinary-types/DisciplinaryTypeEditModal";
import { useAdmin } from "@/app/AdminContext";
import { AdminPageHeader } from "@/app/AdminPageHeader";
import { AdminEmptyState, AdminListRow } from "@/components/admin/AdminListRow";
import { AdminError, AdminLoading } from "@/components/admin/AdminState";
import { describeLimits, formatLength } from "@/components/admin/Disciplinary";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type { StaffDisciplinaryType } from "@/lib/arcadia/types";

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

  if (error && !types)
    return (
      <AdminError
        message={error}
        onRetry={() => {
          setError(null);
          load();
        }}
      />
    );

  if (!types) return <AdminLoading />;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
      <AdminPageHeader
        title="Disciplinary Types"
        description="Templates for staff warnings/suspensions: self-assignable severity, the permissions they limit a member to, and whether they need approval before taking effect."
        action={
          hasPerm("manage_disciplinaries") && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setEditing("new")}
            >
              <Plus size={14} />
              New Type
            </Button>
          )
        }
      />

      {error && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="mt-6 divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
        {types.length === 0 && (
          <AdminEmptyState message="No disciplinary types yet." />
        )}
        {types.map((type) => (
          <AdminListRow
            key={type.id}
            actions={
              hasPerm("manage_disciplinaries") && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditing(type)}
                  >
                    <Pencil size={12} />
                  </Button>
                  <Button
                    variant={confirmDeleteId === type.id ? "danger" : "ghost"}
                    size="sm"
                    loading={deleting === type.id}
                    onClick={() => handleDeleteClick(type.id)}
                  >
                    <Trash2 size={12} />
                  </Button>
                </>
              )
            }
          >
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-semibold text-zinc-950 dark:text-zinc-50">
                {type.name}
              </span>
              {type.self_assignable && (
                <Badge variant="info">Staff can request</Badge>
              )}
              {type.needs_approval && (
                <Badge variant="warning">Needs approval</Badge>
              )}
            </div>
            <p className="mt-0.5 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
              {type.description}
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {describeLimits(type)}
              {type.max_expiry != null
                ? ` · lasts at most ${formatLength(type.max_expiry)}`
                : " · no time limit"}
            </p>
          </AdminListRow>
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
