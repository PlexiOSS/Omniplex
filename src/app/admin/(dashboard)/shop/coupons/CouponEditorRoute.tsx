"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AdminError, AdminLoading } from "@/components/admin/AdminState";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type { ShopCoupon, ShopItem } from "@/lib/arcadia/types";
import { useAdmin } from "../../../AdminContext";
import { ShopCouponEditModal } from "./ShopCouponEditModal";

export function CouponEditorRoute({ id }: { id?: string }) {
  const { loginToken } = useAdmin();
  const router = useRouter();
  const [target, setTarget] = useState<ShopCoupon | null | undefined>(
    undefined,
  );
  const [items, setItems] = useState<ShopItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [list, shopItems] = await Promise.all([
        arcadia.shopCoupons.list(loginToken),
        arcadia.shopItems.list(loginToken),
      ]);
      setItems(shopItems);
      if (!id) return setTarget(null);
      const found = list.find((c) => c.id === id);
      if (!found) throw new Error("missing");
      setTarget(found);
    } catch (err) {
      setError(
        err instanceof ArcadiaError
          ? err.message
          : err instanceof Error && err.message === "missing"
            ? "That coupon doesn't exist."
            : "Failed to load.",
      );
    }
  }, [loginToken, id]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <AdminError message={error} onRetry={load} />;
  if (target === undefined) return <AdminLoading />;

  return (
    <ShopCouponEditModal
      loginToken={loginToken}
      coupon={target ?? undefined}
      items={items}
      onClose={() => router.push("/admin/shop/coupons")}
      onSaved={() => {}}
    />
  );
}
