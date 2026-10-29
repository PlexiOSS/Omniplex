"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type { ShopCoupon, ShopItem } from "@/lib/arcadia/types";
import { EditorPage } from "../../EditorPage";

const TARGET_TYPES = ["bot", "server"] as const;

interface ShopCouponEditModalProps {
  loginToken: string;
  items: ShopItem[];
  /** Omit for create; pass an existing coupon for edit. */
  coupon?: ShopCoupon;
  onClose: () => void;
  onSaved: () => void;
}

export function ShopCouponEditModal({
  loginToken,
  items,
  coupon,
  onClose,
  onSaved,
}: ShopCouponEditModalProps) {
  const isEdit = !!coupon;
  const [id, setId] = useState(coupon?.id ?? "");
  const [code, setCode] = useState(coupon?.code ?? "");
  const [isPublic, setIsPublic] = useState(coupon?.public ?? false);
  const [usable, setUsable] = useState(coupon?.usable ?? true);
  const [maxUses, setMaxUses] = useState(
    coupon ? (coupon.max_uses != null ? String(coupon.max_uses) : "") : "1",
  );
  const [reuseWaitHours, setReuseWaitHours] = useState(
    coupon?.reuse_wait_duration != null
      ? String(coupon.reuse_wait_duration)
      : "",
  );
  const [expiryHours, setExpiryHours] = useState(
    coupon?.expiry != null ? String(coupon.expiry) : "",
  );
  const [allowedUsers, setAllowedUsers] = useState(
    (coupon?.allowed_users ?? []).join("\n"),
  );
  const [credits, setCredits] = useState(
    coupon?.cents != null ? (coupon.cents / 100).toFixed(2) : "",
  );
  const [applicableItems, setApplicableItems] = useState<string[]>(
    coupon?.applicable_items ?? [],
  );
  const [targetTypes, setTargetTypes] = useState<string[]>(
    coupon?.target_types ?? [],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(list: string[], setList: (v: string[]) => void, v: string) {
    setList(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  }

  function optionalWhole(value: string): number | null | undefined {
    if (!value.trim()) return null;
    const n = Number(value);
    return Number.isInteger(n) && n > 0 ? n : undefined;
  }

  async function handleSave() {
    const maxUsesNum = optionalWhole(maxUses);
    const reuseWaitNum = optionalWhole(reuseWaitHours);
    const expiryNum = optionalWhole(expiryHours);
    const users = allowedUsers
      .split(/[\s,]+/)
      .map((u) => u.trim())
      .filter(Boolean);

    if (!id.trim() || !code.trim()) {
      setError("ID and code are required.");
      return;
    }
    if (
      maxUsesNum === undefined ||
      reuseWaitNum === undefined ||
      expiryNum === undefined
    ) {
      setError(
        "Max uses, reuse wait and expiry must be whole numbers above 0, or left empty for no limit.",
      );
      return;
    }
    if (users.some((u) => !/^\d{17,20}$/.test(u))) {
      setError("Allowed users must be Discord user IDs.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        id: id.trim(),
        code: code.trim(),
        public: isPublic,
        max_uses: maxUsesNum,
        reuse_wait_duration: reuseWaitNum,
        expiry: expiryNum,
        applicable_items: applicableItems,
        cents: credits.trim() ? Math.round(Number(credits) * 100) : null,
        requirements: coupon?.requirements ?? [],
        allowed_users: users,
        usable,
        target_types: targetTypes,
      };
      if (isEdit) {
        await arcadia.shopCoupons.edit(loginToken, payload);
      } else {
        await arcadia.shopCoupons.create(loginToken, payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ArcadiaError ? err.message : "Failed to save.");
      setSaving(false);
    }
  }

  return (
    <EditorPage
      onBack={onClose}
      backLabel="Back to Coupons"
      title={isEdit ? "Edit Coupon" : "Create Coupon"}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            id="coupon-id"
            label="ID"
            value={id}
            onChange={(e) => setId(e.target.value)}
            disabled={isEdit}
            required
          />
          <Input
            id="coupon-code"
            label="Code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            id="coupon-max-uses"
            label="Max uses"
            type="number"
            min={1}
            placeholder="Unlimited"
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
          />
          <Input
            id="coupon-reuse-wait"
            label="Reuse wait (hours)"
            type="number"
            min={1}
            placeholder="None"
            value={reuseWaitHours}
            onChange={(e) => setReuseWaitHours(e.target.value)}
          />
          <Input
            id="coupon-expiry"
            label="Expires after (hours)"
            type="number"
            min={1}
            placeholder="Never"
            value={expiryHours}
            onChange={(e) => setExpiryHours(e.target.value)}
          />
        </div>
        <p className="-mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          Leave any of these empty for no limit. Expiry counts from when the
          coupon was created.
        </p>

        <Input
          id="coupon-cents"
          label="Item price with this coupon (credits, optional)"
          type="number"
          min={0}
          step={0.01}
          placeholder="Free"
          value={credits}
          onChange={(e) => setCredits(e.target.value)}
        />

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="coupon-allowed-users"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Allowed users (optional)
          </label>
          <textarea
            id="coupon-allowed-users"
            rows={2}
            value={allowedUsers}
            onChange={(e) => setAllowedUsers(e.target.value)}
            placeholder="Discord user IDs, one per line. Empty means anyone."
            className="w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2.5 font-mono text-sm text-zinc-950 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
          />
        </div>

        <div className="flex gap-6">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 accent-accent dark:border-zinc-700"
            />
            <span className="text-sm text-zinc-700 dark:text-zinc-300">
              Public (listed at /shop/public-coupons)
            </span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={usable}
              onChange={(e) => setUsable(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 accent-accent dark:border-zinc-700"
            />
            <span className="text-sm text-zinc-700 dark:text-zinc-300">
              Usable
            </span>
          </label>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Applies to
          </p>
          <div className="flex gap-4">
            {TARGET_TYPES.map((type) => (
              <label
                key={type}
                className="flex cursor-pointer items-center gap-2"
              >
                <input
                  type="checkbox"
                  checked={targetTypes.includes(type)}
                  onChange={() => toggle(targetTypes, setTargetTypes, type)}
                  className="h-4 w-4 rounded border-zinc-300 accent-accent dark:border-zinc-700"
                />
                <span className="text-sm capitalize text-zinc-700 dark:text-zinc-300">
                  {type}s
                </span>
              </label>
            ))}
          </div>
        </div>

        {items.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Applicable items (leave empty for all)
            </p>
            <div className="max-h-32 space-y-1.5 overflow-y-auto">
              {items.map((item) => (
                <label
                  key={item.id}
                  className="flex cursor-pointer items-center gap-2"
                >
                  <input
                    type="checkbox"
                    checked={applicableItems.includes(item.id)}
                    onChange={() =>
                      toggle(applicableItems, setApplicableItems, item.id)
                    }
                    className="h-4 w-4 rounded border-zinc-300 accent-accent dark:border-zinc-700"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">
                    {item.name}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" loading={saving} onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </EditorPage>
  );
}
