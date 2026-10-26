"use client";

import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AdminError, AdminLoading } from "@/components/admin/AdminState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type { StaffPosition } from "@/lib/arcadia/types";
import { useAdmin } from "../../../AdminContext";
import { AdminPageHeader } from "../../../AdminPageHeader";

export default function StaffPositionsPage() {
  const router = useRouter();
  const { loginToken, staffMember, hasPerm } = useAdmin();

  const [positions, setPositions] = useState<StaffPosition[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const confirmRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // staffMember.rank mirrors the backend's perms.StaffGrants.Rank() exactly
  // (including the instance-owner case, which outranks every position
  // without holding one) — deriving this from `positions` instead would
  // rank an owner holding none below everyone, which is backwards.
  const myLowestIndex = staffMember.rank;

  const load = useCallback(async () => {
    try {
      setPositions(await arcadia.staffPositions.list(loginToken));
    } catch (err) {
      setError(
        err instanceof ArcadiaError ? err.message : "Failed to load positions.",
      );
    }
  }, [loginToken]);

  useEffect(() => {
    load();
  }, [load]);

  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);

  async function moveTo(fromId: string, toId: string) {
    if (!positions || fromId === toId) return;
    const from = positions.findIndex((p) => p.id === fromId);
    const to = positions.findIndex((p) => p.id === toId);
    if (from < 0 || to < 0) return;
    const range =
      from < to ? positions.slice(from, to + 1) : positions.slice(to, from + 1);
    if (range.some((p) => p.index <= myLowestIndex)) {
      setError("You can't move a position above your own rank.");
      return;
    }
    setMoving(true);
    setError(null);
    try {
      if (from < to) {
        for (let k = from; k < to; k++) {
          await arcadia.staffPositions.swapIndex(
            loginToken,
            fromId,
            positions[k + 1].id,
          );
        }
      } else {
        for (let k = from; k > to; k--) {
          await arcadia.staffPositions.swapIndex(
            loginToken,
            fromId,
            positions[k - 1].id,
          );
        }
      }
    } catch (err) {
      setError(
        err instanceof ArcadiaError ? err.message : "Failed to reorder.",
      );
    } finally {
      await load();
      setMoving(false);
    }
  }

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

  if (error && !positions)
    return (
      <AdminError
        message={error}
        onRetry={() => {
          setError(null);
          load();
        }}
      />
    );

  if (!positions) return <AdminLoading />;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
      <AdminPageHeader
        title="Staff Positions"
        description="Drag to reorder: higher up is more senior. You can't edit, delete or move positions at or above your own rank."
        action={
          hasPerm("manage_staff_roles") && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => router.push("/admin/staff/positions/new")}
            >
              <Plus size={14} />
              New Position
            </Button>
          )
        }
      />

      {error && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="mt-6 divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
        {positions.map((position, i) => {
          const locked = position.index <= myLowestIndex;
          const prev = positions[i - 1];
          const next = positions[i + 1];
          const canDrag = !locked && hasPerm("manage_staff_roles") && !moving;

          return (
            // biome-ignore lint/a11y/noStaticElementInteractions: drag-and-drop row; the arrow buttons are the keyboard alternative
            <div
              key={position.id}
              draggable={canDrag}
              onDragStart={(e) => {
                setDragId(position.id);
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragOver={(e) => {
                if (!dragId || locked) return;
                e.preventDefault();
                setOverId(position.id);
              }}
              onDragLeave={() =>
                setOverId((o) => (o === position.id ? null : o))
              }
              onDrop={(e) => {
                e.preventDefault();
                if (dragId) moveTo(dragId, position.id);
                setDragId(null);
                setOverId(null);
              }}
              onDragEnd={() => {
                setDragId(null);
                setOverId(null);
              }}
              className={[
                "flex items-center gap-3 px-4 py-3.5 transition-colors",
                dragId === position.id ? "opacity-40" : "",
                overId === position.id && dragId !== position.id
                  ? "bg-accent/10 ring-1 ring-inset ring-accent/40"
                  : "hover:bg-zinc-50 dark:hover:bg-zinc-800/40",
                moving ? "pointer-events-none opacity-60" : "",
              ].join(" ")}
            >
              <span
                className={[
                  "shrink-0",
                  canDrag
                    ? "cursor-grab text-zinc-400 active:cursor-grabbing"
                    : "text-zinc-200 dark:text-zinc-700",
                ].join(" ")}
                title={canDrag ? "Drag to reorder" : undefined}
              >
                <GripVertical size={16} />
              </span>
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  disabled={!prev || locked || !hasPerm("manage_staff_roles")}
                  onClick={() => prev && handleSwap(position.id, prev.id)}
                  className="text-zinc-400 hover:text-zinc-900 disabled:opacity-30 dark:hover:text-zinc-50"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  disabled={!next || locked || !hasPerm("manage_staff_roles")}
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
                  <Badge variant="info">#{position.index}</Badge>
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
                    onClick={() =>
                      router.push(
                        `/admin/staff/positions/${encodeURIComponent(position.id)}`,
                      )
                    }
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
    </div>
  );
}
