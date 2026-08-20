"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type { ShopCoupon, ShopItem } from "@/lib/arcadia/types";

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
    coupon?.max_uses != null ? String(coupon.max_uses) : "1",
  );
  const [reuseWaitSeconds, setReuseWaitSeconds] = useState(
    coupon?.reuse_wait_duration != null
      ? String(coupon.reuse_wait_duration)
      : "",
  );
  const [expirySeconds, setExpirySeconds] = useState(
    coupon?.expiry != null ? String(coupon.expiry) : "",
  );
  const [dollars, setDollars] = useState(
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

  async function handleSave() {
    const maxUsesNum = Number(maxUses);
    const reuseWaitNum = Number(reuseWaitSeconds);
    const expiryNum = Number(expirySeconds);

    if (
      !id.trim() ||
      !code.trim() ||
      !Number.isFinite(maxUsesNum) ||
      maxUsesNum <= 0 ||
      !Number.isFinite(reuseWaitNum) ||
      reuseWaitNum <= 0 ||
      !Number.isFinite(expiryNum) ||
      expiryNum <= 0
    ) {
      setError(
        "ID, code, max uses, reuse wait, and expiry are all required and must be greater than 0 — Popplio currently rejects 0/empty for these (a reproduced upstream bug, not a real limit you can opt out of).",
      );
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
        cents: dollars.trim() ? Math.round(Number(dollars) * 100) : null,
        requirements: [],
        allowed_users: [],
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
    <Modal
      open
      onClose={onClose}
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
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
            required
          />
          <Input
            id="coupon-reuse-wait"
            label="Reuse wait (sec)"
            type="number"
            min={1}
            value={reuseWaitSeconds}
            onChange={(e) => setReuseWaitSeconds(e.target.value)}
            required
          />
          <Input
            id="coupon-expiry"
            label="Expires in (sec)"
            type="number"
            min={1}
            value={expirySeconds}
            onChange={(e) => setExpirySeconds(e.target.value)}
            required
          />
        </div>

        <Input
          id="coupon-cents"
          label="Discount (dollars, optional)"
          type="number"
          min={0}
          step={0.01}
          value={dollars}
          onChange={(e) => setDollars(e.target.value)}
        />

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
    </Modal>
  );
}
