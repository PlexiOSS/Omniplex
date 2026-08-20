"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type { ShopItemBenefit } from "@/lib/arcadia/types";
import { isRecognizedBenefit } from "@/lib/constants/shopBenefits";

const TARGET_TYPES = ["bot", "server"] as const;

interface ShopItemBenefitEditModalProps {
  loginToken: string;
  /** Omit for create; pass an existing benefit for edit. */
  benefit?: ShopItemBenefit;
  onClose: () => void;
  onSaved: () => void;
}

export function ShopItemBenefitEditModal({
  loginToken,
  benefit,
  onClose,
  onSaved,
}: ShopItemBenefitEditModalProps) {
  const isEdit = !!benefit;
  const [id, setId] = useState(benefit?.id ?? "");
  const [name, setName] = useState(benefit?.name ?? "");
  const [description, setDescription] = useState(benefit?.description ?? "");
  const [targetTypes, setTargetTypes] = useState<string[]>(
    benefit?.target_types ?? [],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleTargetType(type: string) {
    setTargetTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  }

  async function handleSave() {
    if (!id.trim() || !name.trim()) {
      setError("ID and name are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        id: id.trim(),
        name: name.trim(),
        description: description.trim(),
        target_types: targetTypes,
      };
      if (isEdit) {
        await arcadia.shopItemBenefits.edit(loginToken, payload);
      } else {
        await arcadia.shopItemBenefits.create(loginToken, payload);
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
      title={isEdit ? "Edit Benefit" : "Create Benefit"}
    >
      <div className="space-y-4">
        <Input
          id="benefit-id"
          label="ID"
          value={id}
          onChange={(e) => setId(e.target.value)}
          disabled={isEdit}
          required
        />
        {id.trim() && !isRecognizedBenefit(id.trim()) && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            "{id.trim()}" isn't one of the IDs the purchase flow recognizes
            (premium_days, priority_boost, featured_slot, supporter_badge,
            vote_blitz) — this benefit will be purchasable but won't actually do
            anything when applied.
          </p>
        )}
        <Input
          id="benefit-name"
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="benefit-description"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Description
          </label>
          <textarea
            id="benefit-description"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
          />
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
                  onChange={() => toggleTargetType(type)}
                  className="h-4 w-4 rounded border-zinc-300 accent-accent dark:border-zinc-700"
                />
                <span className="text-sm capitalize text-zinc-700 dark:text-zinc-300">
                  {type}s
                </span>
              </label>
            ))}
          </div>
        </div>

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
