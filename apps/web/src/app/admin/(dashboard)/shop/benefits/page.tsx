"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AdminEmptyState, AdminListRow } from "@/components/admin/AdminListRow";
import { AdminError, AdminLoading } from "@/components/admin/AdminState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type { ShopItemBenefit } from "@/lib/arcadia/types";
import { isRecognizedBenefit } from "@/lib/constants/shopBenefits";
import { useAdmin } from "../../../AdminContext";
import { AdminPageHeader } from "../../../AdminPageHeader";
import { ShopItemBenefitEditModal } from "./ShopItemBenefitEditModal";

export default function ShopBenefitsPage() {
  const { loginToken, hasPerm } = useAdmin();

  const [benefits, setBenefits] = useState<ShopItemBenefit[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ShopItemBenefit | "new" | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const confirmRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    try {
      setBenefits(await arcadia.shopItemBenefits.list(loginToken));
    } catch (err) {
      setError(
        err instanceof ArcadiaError ? err.message : "Failed to load benefits.",
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
    arcadia.shopItemBenefits
      .delete(loginToken, id)
      .then(load)
      .catch((err) =>
        setError(
          err instanceof ArcadiaError ? err.message : "Failed to delete.",
        ),
      )
      .finally(() => setDeleting(null));
  }

  if (error && !benefits)
    return (
      <AdminError
        message={error}
        onRetry={() => {
          setError(null);
          load();
        }}
      />
    );

  if (!benefits) return <AdminLoading />;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
      <AdminPageHeader
        title="Shop Benefits"
        description="What buying a shop item actually gets you. Items reference these by ID, and a benefit still in use can't be deleted."
        action={
          hasPerm("manage_shop") && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setEditing("new")}
            >
              <Plus size={14} />
              New Benefit
            </Button>
          )
        }
      />

      {error && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="mt-6 divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
        {benefits.length === 0 && (
          <AdminEmptyState message="No shop benefits yet." />
        )}
        {benefits.map((benefit) => (
          <AdminListRow
            key={benefit.id}
            actions={
              hasPerm("manage_shop") && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditing(benefit)}
                  >
                    <Pencil size={12} />
                  </Button>
                  <Button
                    variant={
                      confirmDeleteId === benefit.id ? "danger" : "ghost"
                    }
                    size="sm"
                    loading={deleting === benefit.id}
                    onClick={() => handleDeleteClick(benefit.id)}
                  >
                    <Trash2 size={12} />
                  </Button>
                </>
              )
            }
          >
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-semibold text-zinc-950 dark:text-zinc-50">
                {benefit.name}
              </span>
              <span className="text-xs text-zinc-400 dark:text-zinc-600">
                {benefit.id}
              </span>
              {isRecognizedBenefit(benefit.id) ? (
                <Badge variant="success">Functional</Badge>
              ) : (
                <Badge variant="warning">Display only</Badge>
              )}
              {benefit.target_types.map((t) => (
                <Badge key={t}>{t}</Badge>
              ))}
            </div>
            <p className="mt-0.5 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
              {benefit.description}
            </p>
          </AdminListRow>
        ))}
      </div>

      {editing === "new" && (
        <ShopItemBenefitEditModal
          loginToken={loginToken}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}
      {editing && editing !== "new" && (
        <ShopItemBenefitEditModal
          loginToken={loginToken}
          benefit={editing}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
