"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type { ShopCoupon, ShopItem } from "@/lib/arcadia/types";
import { AdminListRow, AdminEmptyState } from "@/components/admin/AdminListRow";
import { useAdmin } from "../../../AdminContext";
import { AdminPageHeader } from "../../../AdminPageHeader";
import { ShopCouponEditModal } from "./ShopCouponEditModal";

export default function ShopCouponsPage() {
  const { loginToken, hasPerm } = useAdmin();

  const [coupons, setCoupons] = useState<ShopCoupon[] | null>(null);
  const [items, setItems] = useState<ShopItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ShopCoupon | "new" | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const confirmRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    try {
      const [couponList, itemList] = await Promise.all([
        arcadia.shopCoupons.list(loginToken),
        arcadia.shopItems.list(loginToken),
      ]);
      setCoupons(couponList);
      setItems(itemList);
    } catch (err) {
      setError(
        err instanceof ArcadiaError ? err.message : "Failed to load coupons.",
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
    arcadia.shopCoupons
      .delete(loginToken, id)
      .then(load)
      .catch((err) =>
        setError(
          err instanceof ArcadiaError ? err.message : "Failed to delete.",
        ),
      )
      .finally(() => setDeleting(null));
  }

  if (error && !coupons) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!coupons) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-50" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <AdminPageHeader
        title="Shop Coupons"
        description="Discount codes, optionally restricted to specific items, target types, or users. Redeemable on the shop page with a coupon code -- requirements isn't enforced yet, everything else is."
        action={
          hasPerm("manage_shop") && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setEditing("new")}
            >
              <Plus size={14} />
              New Coupon
            </Button>
          )
        }
      />

      {error && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="mt-6 space-y-2">
        {coupons.length === 0 && (
          <AdminEmptyState message="No shop coupons yet." />
        )}
        {coupons.map((coupon) => (
          <AdminListRow
            key={coupon.id}
            actions={
              hasPerm("manage_shop") && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditing(coupon)}
                  >
                    <Pencil size={12} />
                  </Button>
                  <Button
                    variant={confirmDeleteId === coupon.id ? "danger" : "ghost"}
                    size="sm"
                    loading={deleting === coupon.id}
                    onClick={() => handleDeleteClick(coupon.id)}
                  >
                    <Trash2 size={12} />
                  </Button>
                </>
              )
            }
          >
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-mono font-semibold text-zinc-950 dark:text-zinc-50">
                {coupon.code}
              </span>
              {coupon.public && <Badge variant="info">Public</Badge>}
              {!coupon.usable && <Badge variant="danger">Disabled</Badge>}
              {coupon.cents != null && (
                <Badge variant="premium">
                  {(coupon.cents / 100).toFixed(2)} off
                </Badge>
              )}
            </div>
            <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-600">
              {coupon.id} · {coupon.max_uses ?? "?"} uses ·{" "}
              {coupon.applicable_items.length === 0
                ? "all items"
                : `${coupon.applicable_items.length} item(s)`}
            </p>
          </AdminListRow>
        ))}
      </div>

      {editing === "new" && (
        <ShopCouponEditModal
          loginToken={loginToken}
          items={items}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}
      {editing && editing !== "new" && (
        <ShopCouponEditModal
          loginToken={loginToken}
          items={items}
          coupon={editing}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
