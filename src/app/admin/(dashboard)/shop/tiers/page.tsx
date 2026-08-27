"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type { VoteCreditTier } from "@/lib/arcadia/types";
import { AdminListRow, AdminEmptyState } from "@/components/admin/AdminListRow";
import { useAdmin } from "../../../AdminContext";
import { AdminPageHeader } from "../../../AdminPageHeader";
import { VoteCreditTierEditModal } from "./VoteCreditTierEditModal";

export default function VoteCreditTiersPage() {
  const { loginToken, hasPerm } = useAdmin();

  const [tiers, setTiers] = useState<VoteCreditTier[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<VoteCreditTier | "new" | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const confirmRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    try {
      setTiers(await arcadia.voteCreditTiers.list(loginToken));
    } catch (err) {
      setError(
        err instanceof ArcadiaError ? err.message : "Failed to load tiers.",
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
    arcadia.voteCreditTiers
      .delete(loginToken, id)
      .then(load)
      .catch((err) =>
        setError(
          err instanceof ArcadiaError ? err.message : "Failed to delete.",
        ),
      )
      .finally(() => setDeleting(null));
  }

  if (error && !tiers) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!tiers) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-50" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <AdminPageHeader
        title="Vote Credit Tiers"
        description="How many votes convert into how much shop credit, per entity type."
        action={
          hasPerm("manage_shop") && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setEditing("new")}
            >
              <Plus size={14} />
              New Tier
            </Button>
          )
        }
      />

      {error && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="mt-6 space-y-2">
        {tiers.length === 0 && (
          <AdminEmptyState message="No vote credit tiers yet." />
        )}
        {tiers.map((tier) => (
          <AdminListRow
            key={tier.id}
            actions={
              hasPerm("manage_shop") && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditing(tier)}
                  >
                    <Pencil size={12} />
                  </Button>
                  <Button
                    variant={confirmDeleteId === tier.id ? "danger" : "ghost"}
                    size="sm"
                    loading={deleting === tier.id}
                    onClick={() => handleDeleteClick(tier.id)}
                  >
                    <Trash2 size={12} />
                  </Button>
                </>
              )
            }
          >
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-semibold text-zinc-950 dark:text-zinc-50">
                {tier.votes} votes → {(tier.cents / 100).toFixed(2)} credits
              </span>
              <Badge>{tier.target_type}</Badge>
            </div>
            <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-600">
              {tier.id} · position {tier.position}
            </p>
          </AdminListRow>
        ))}
      </div>

      {editing === "new" && (
        <VoteCreditTierEditModal
          loginToken={loginToken}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}
      {editing && editing !== "new" && (
        <VoteCreditTierEditModal
          loginToken={loginToken}
          tier={editing}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
