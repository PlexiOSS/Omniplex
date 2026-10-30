"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AdminEmptyState, AdminListRow } from "@/components/admin/AdminListRow";
import { AdminError, AdminLoading } from "@/components/admin/AdminState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type { ShopCoupon } from "@/lib/arcadia/types";
import { useAdmin } from "../../../AdminContext";
import { AdminPageHeader } from "../../../AdminPageHeader";

export default function ShopCouponsPage() {
  const router = useRouter();
  const { loginToken, hasPerm } = useAdmin();

  const [coupons, setCoupons] = useState<ShopCoupon[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const confirmRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    try {
      setCoupons(await arcadia.shopCoupons.list(loginToken));
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

  if (error && !coupons)
    return (
      <AdminError
        message={error}
        onRetry={() => {
          setError(null);
          load();
        }}
      />
    );

  if (!coupons) return <AdminLoading />;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
      <AdminPageHeader
        title="Shop Coupons"
        description="Discount codes, optionally restricted to specific items, target types, or users. Members redeem them with a code on the Shop page. Every restriction is enforced except requirements, which aren't checked yet."
        action={
          hasPerm("manage_shop") && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => router.push("/admin/shop/coupons/new")}
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

      <div className="mt-6 divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
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
                    onClick={() =>
                      router.push(
                        `/admin/shop/coupons/${encodeURIComponent(coupon.id)}`,
                      )
                    }
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
              <Badge variant="premium">
                {coupon.cents != null
                  ? `Items for ${(coupon.cents / 100).toFixed(2)} credits`
                  : "Items free"}
              </Badge>
              {coupon.allowed_users.length > 0 && (
                <Badge>
                  {coupon.allowed_users.length === 1
                    ? "1 user only"
                    : `${coupon.allowed_users.length} users only`}
                </Badge>
              )}
            </div>
            <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-600">
              {coupon.id} ·{" "}
              {coupon.max_uses != null
                ? `${coupon.max_uses} uses`
                : "unlimited uses"}{" "}
              ·{" "}
              {coupon.applicable_items.length === 0
                ? "all items"
                : `${coupon.applicable_items.length} item(s)`}
            </p>
          </AdminListRow>
        ))}
      </div>
    </div>
  );
}
