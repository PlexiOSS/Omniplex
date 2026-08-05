"use client";

import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { staff } from "@/lib/api";
import type { PermissionData } from "@/lib/api/types";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type { StaffPosition } from "@/lib/arcadia/types";
import { AdminPageHeader } from "../../../AdminPageHeader";
import { useAdmin } from "../../../AdminContext";
import { PositionEditModal } from "./PositionEditModal";

export default function StaffPositionsPage() {
  const { loginToken, staffMember, hasPerm } = useAdmin();

  const [positions, setPositions] = useState<StaffPosition[] | null>(null);
  const [catalog, setCatalog] = useState<PermissionData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<StaffPosition | "new" | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const confirmRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const myLowestIndex = staffMember.positions.reduce(
    (min, p) => Math.min(min, p.index),
    Number.POSITIVE_INFINITY,
  );

  const load = useCallback(async () => {
    try {
      const [pos, cat] = await Promise.all([
        arcadia.staffPositions.list(loginToken),
        staff.getPermissionCatalog(),
      ]);
      setPositions(pos);
      setCatalog(cat.perms);
    } catch (err) {
      setError(
        err instanceof ArcadiaError ? err.message : "Failed to load positions.",
      );
    }
  }, [loginToken]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSwap(a: string, b: string) {
    try {
      await arcadia.staffPositions.swapIndex(loginToken, a, b);
      await load();
    } catch (err) {
      setError(
        err instanceof ArcadiaError ? err.message : "Failed to reorder.",
      );
    }
  }

  function handleDeleteClick(id: string) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      confirmRef.current = setTimeout(() => setConfirmDeleteId(null), 3000);
      return;
    }
    if (confirmRef.current) clearTimeout(confirmRef.current);
    setConfirmDeleteId(null);
    setDeleting(id);
    arcadia.staffPositions
      .delete(loginToken, id)
      .then(load)
      .catch((err) =>
        setError(
          err instanceof ArcadiaError ? err.message : "Failed to delete.",
        ),
      )
      .finally(() => setDeleting(null));
  }

  if (error && !positions) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!positions) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-50" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <AdminPageHeader
        title="Staff Positions"
        description="Lower index = more senior. You can't edit, delete, or reorder positions at or below your own lowest index."
        action={
          hasPerm("manage_staff_roles") && (
            <Button variant="primary" size="sm" onClick={() => setEditing("new")}>
              <Plus size={14} />
              New Position
            </Button>
          )
        }
      />

      {error && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="mt-6 space-y-2">
        {positions.map((position, i) => {
          const locked = position.index <= myLowestIndex;
          const prev = positions[i - 1];
          const next = positions[i + 1];

          return (
            <div
              key={position.id}
              className="flex items-center gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  disabled={
                    !prev || locked || !hasPerm("manage_staff_roles")
                  }
                  onClick={() => prev && handleSwap(position.id, prev.id)}
                  className="text-zinc-400 hover:text-zinc-900 disabled:opacity-30 dark:hover:text-zinc-50"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  disabled={
                    !next || locked || !hasPerm("manage_staff_roles")
                  }
                  onClick={() => next && handleSwap(position.id, next.id)}
                  className="text-zinc-400 hover:text-zinc-900 disabled:opacity-30 dark:hover:text-zinc-50"
                >
                  <ArrowDown size={14} />
                </button>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-semibold text-zinc-950 dark:text-zinc-50">
                    {position.name}
                  </span>
                  <Badge variant="info">index {position.index}</Badge>
                  {locked && <Badge variant="warning">Locked</Badge>}
                </div>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {position.perms.length} permission
                  {position.perms.length === 1 ? "" : "s"} · role{" "}
                  {position.role_id}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {hasPerm("manage_staff_roles") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={locked}
                    onClick={() => setEditing(position)}
                  >
                    <Pencil size={12} />
                  </Button>
                )}
                {hasPerm("manage_staff_roles") && (
                  <Button
                    variant={
                      confirmDeleteId === position.id ? "danger" : "ghost"
                    }
                    size="sm"
                    disabled={locked}
                    loading={deleting === position.id}
                    onClick={() => handleDeleteClick(position.id)}
                  >
                    <Trash2 size={12} />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {editing === "new" && (
        <PositionEditModal
          loginToken={loginToken}
          granterPerms={staffMember.resolved_perms}
          catalog={catalog}
          defaultIndex={
            positions.length > 0
              ? Math.max(...positions.map((p) => p.index)) + 1
              : 0
          }
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}
      {editing && editing !== "new" && (
        <PositionEditModal
          loginToken={loginToken}
          granterPerms={staffMember.resolved_perms}
          catalog={catalog}
          position={editing}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
