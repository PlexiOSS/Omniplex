"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AdminEmptyState, AdminListRow } from "@/components/admin/AdminListRow";
import { AdminError, AdminLoading } from "@/components/admin/AdminState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type { PromoCode } from "@/lib/arcadia/types";
import { useAdmin } from "../../../AdminContext";
import { AdminPageHeader } from "../../../AdminPageHeader";
import { describePromo } from "./describePromo";

const PRODUCT_LABELS: Record<string, string> = {
  premium: "Premium",
  autovote: "Auto-vote",
};

function status(promo: PromoCode) {
  if (!promo.active) return { label: "Off", variant: "danger" as const };
  if (promo.expires_at && new Date(promo.expires_at) <= new Date()) {
    return { label: "Expired", variant: "warning" as const };
  }
  if (
    promo.max_redemptions != null &&
    promo.redemptions >= promo.max_redemptions
  ) {
    return { label: "Used up", variant: "warning" as const };
  }
  return { label: "Active", variant: "success" as const };
}

export default function PromoCodesPage() {
  const router = useRouter();
  const { loginToken, hasPerm } = useAdmin();
  const canManage = hasPerm("manage_promo_codes");

  const [codes, setCodes] = useState<PromoCode[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setCodes(await arcadia.promoCodes.list(loginToken));
    } catch (err) {
      setError(
        err instanceof ArcadiaError
          ? err.message
          : "Failed to load promo codes.",
      );
    }
  }, [loginToken]);

  useEffect(() => {
    load();
  }, [load]);

  function toggle(promo: PromoCode) {
    setToggling(promo.id);
    setError(null);
    arcadia.promoCodes
      .setActive(loginToken, promo.id, !promo.active)
      .then(load)
      .catch((err) =>
        setError(
          err instanceof ArcadiaError ? err.message : "Failed to update.",
        ),
      )
      .finally(() => setToggling(null));
  }

  if (error && !codes)
    return (
      <AdminError
        message={error}
        onRetry={() => {
          setError(null);
          load();
        }}
      />
    );

  if (!codes) return <AdminLoading />;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
      <AdminPageHeader
        title="Promo Codes"
        description="Stripe discount codes for premium and Auto-vote card payments. Members enter them at checkout. Codes can't be edited after they're made, only turned off and on."
        action={
          canManage && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => router.push("/admin/shop/promo-codes/new")}
            >
              <Plus size={14} />
              New Promo Code
            </Button>
          )
        }
      />

      {error && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="mt-6 divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
        {codes.length === 0 && (
          <AdminEmptyState message="No promo codes yet." />
        )}
        {codes.map((promo) => {
          const s = status(promo);
          return (
            <AdminListRow
              key={promo.id}
              actions={
                canManage && (
                  <Button
                    variant={promo.active ? "ghost" : "secondary"}
                    size="sm"
                    loading={toggling === promo.id}
                    onClick={() => toggle(promo)}
                  >
                    {promo.active ? "Turn off" : "Turn on"}
                  </Button>
                )
              }
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-mono font-semibold text-zinc-950 dark:text-zinc-50">
                  {promo.code}
                </span>
                <Badge variant={s.variant}>{s.label}</Badge>
                {promo.products.map((p) => (
                  <Badge key={p} variant="info">
                    {PRODUCT_LABELS[p] ?? p}
                  </Badge>
                ))}
                {promo.once_per_user && <Badge>Once per member</Badge>}
                {promo.new_customers_only && <Badge>New customers</Badge>}
              </div>
              <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-300">
                {describePromo(promo)}
                {promo.description && ` · ${promo.description}`}
              </p>
              <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-600">
                {promo.redemptions}
                {promo.max_redemptions != null
                  ? ` of ${promo.max_redemptions}`
                  : ""}{" "}
                used ·{" "}
                {promo.expires_at
                  ? `expires ${new Date(promo.expires_at).toLocaleString()}`
                  : "never expires"}{" "}
                · {promo.stripe_promotion_code_id}
              </p>
            </AdminListRow>
          );
        })}
      </div>
    </div>
  );
}
