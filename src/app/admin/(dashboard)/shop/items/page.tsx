"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type { ShopItem, ShopItemBenefit } from "@/lib/arcadia/types";
import { isRecognizedBenefit } from "@/lib/constants/shopBenefits";
import { useAdmin } from "../../../AdminContext";
import { AdminPageHeader } from "../../../AdminPageHeader";
import { ShopItemEditModal } from "./ShopItemEditModal";

export default function ShopItemsPage() {
  const { loginToken, hasPerm } = useAdmin();

  const [items, setItems] = useState<ShopItem[] | null>(null);
  const [benefits, setBenefits] = useState<ShopItemBenefit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ShopItem | "new" | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const confirmRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    try {
      const [itemList, benefitList] = await Promise.all([
        arcadia.shopItems.list(loginToken),
        arcadia.shopItemBenefits.list(loginToken),
      ]);
      setItems(itemList);
      setBenefits(benefitList);
    } catch (err) {
      setError(
        err instanceof ArcadiaError ? err.message : "Failed to load items.",
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
    arcadia.shopItems
      .delete(loginToken, id)
      .then(load)
      .catch((err) =>
        setError(
          err instanceof ArcadiaError ? err.message : "Failed to delete.",
        ),
      )
      .finally(() => setDeleting(null));
  }

  const benefitName = (id: string) =>
    benefits.find((b) => b.id === id)?.name ?? id;

  if (error && !items) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!items) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-50" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <AdminPageHeader
        title="Shop Items"
        description="What's purchasable in the shop, its price in credits, and which benefits it grants."
        action={
          hasPerm("manage_shop") && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setEditing("new")}
            >
              <Plus size={14} />
              New Item
            </Button>
          )
        }
      />

      {error && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="mt-6 space-y-2">
        {items.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No shop items yet.
          </p>
        )}
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-semibold text-zinc-950 dark:text-zinc-50">
                  {item.name}
                </span>
                <Badge variant="premium">
                  {(item.cents / 100).toFixed(2)} credits
                </Badge>
                {item.target_types.map((t) => (
                  <Badge key={t}>{t}</Badge>
                ))}
              </div>
              <p className="mt-0.5 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
                {item.description}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-600">
                {item.duration > 0 && <span>{item.duration}h duration ·</span>}
                {item.benefits.length === 0 ? (
                  <span>No benefits attached</span>
                ) : (
                  item.benefits.map((b) => (
                    <span
                      key={b}
                      className={
                        isRecognizedBenefit(b)
                          ? undefined
                          : "text-amber-600 dark:text-amber-400"
                      }
                    >
                      {benefitName(b)}
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {hasPerm("manage_shop") && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditing(item)}
                  >
                    <Pencil size={12} />
                  </Button>
                  <Button
                    variant={confirmDeleteId === item.id ? "danger" : "ghost"}
                    size="sm"
                    loading={deleting === item.id}
                    onClick={() => handleDeleteClick(item.id)}
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
        <ShopItemEditModal
          loginToken={loginToken}
          benefits={benefits}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}
      {editing && editing !== "new" && (
        <ShopItemEditModal
          loginToken={loginToken}
          benefits={benefits}
          item={editing}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
