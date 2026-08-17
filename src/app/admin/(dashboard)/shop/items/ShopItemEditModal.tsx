"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type { ShopItem, ShopItemBenefit } from "@/lib/arcadia/types";
import { isRecognizedBenefit } from "@/lib/constants/shopBenefits";

const TARGET_TYPES = ["bot", "server"] as const;

interface ShopItemEditModalProps {
  loginToken: string;
  benefits: ShopItemBenefit[];
  /** Omit for create; pass an existing item for edit. */
  item?: ShopItem;
  onClose: () => void;
  onSaved: () => void;
}

export function ShopItemEditModal({
  loginToken,
  benefits,
  item,
  onClose,
  onSaved,
}: ShopItemEditModalProps) {
  const isEdit = !!item;
  const [id, setId] = useState(item?.id ?? "");
  const [name, setName] = useState(item?.name ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [dollars, setDollars] = useState(
    item ? (item.cents / 100).toFixed(2) : "",
  );
  const [durationHours, setDurationHours] = useState(
    item ? String(item.duration) : "",
  );
  const [targetTypes, setTargetTypes] = useState<string[]>(
    item?.target_types ?? [],
  );
  const [selectedBenefits, setSelectedBenefits] = useState<string[]>(
    item?.benefits ?? [],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(list: string[], setList: (v: string[]) => void, v: string) {
    setList(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  }

  const hasUnrecognizedBenefit = selectedBenefits.some(
    (b) => !isRecognizedBenefit(b),
  );

  async function handleSave() {
    const cents = Math.round(Number(dollars) * 100);

    if (!id.trim() || !name.trim() || Number.isNaN(cents) || cents < 0) {
      setError("ID, name, and a valid price are required.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        id: id.trim(),
        name: name.trim(),
        description: description.trim(),
        cents,
        target_types: targetTypes,
        benefits: selectedBenefits,
        duration: Number(durationHours) || 0,
      };
      if (isEdit) {
        await arcadia.shopItems.edit(loginToken, payload);
      } else {
        await arcadia.shopItems.create(loginToken, payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ArcadiaError ? err.message : "Failed to save.");
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={isEdit ? "Edit Item" : "Create Item"}>
      <div className="space-y-4">
        <Input
          id="item-id"
          label="ID"
          value={id}
          onChange={(e) => setId(e.target.value)}
          disabled={isEdit}
          required
        />
        <Input
          id="item-name"
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="item-description"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Description
          </label>
          <textarea
            id="item-description"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            id="item-cents"
            label="Price (credits)"
            type="number"
            min={0}
            step={0.01}
            value={dollars}
            onChange={(e) => setDollars(e.target.value)}
            required
          />
          <Input
            id="item-duration"
            label="Duration (hours)"
            type="number"
            min={0}
            value={durationHours}
            onChange={(e) => setDurationHours(e.target.value)}
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

        <div>
          <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Benefits
          </p>
          {benefits.length === 0 ? (
            <p className="text-xs text-zinc-400 dark:text-zinc-600">
              No shop benefits exist yet — create one first.
            </p>
          ) : (
            <div className="space-y-1.5">
              {benefits.map((benefit) => (
                <label
                  key={benefit.id}
                  className="flex cursor-pointer items-center gap-2"
                >
                  <input
                    type="checkbox"
                    checked={selectedBenefits.includes(benefit.id)}
                    onChange={() =>
                      toggle(selectedBenefits, setSelectedBenefits, benefit.id)
                    }
                    className="h-4 w-4 rounded border-zinc-300 accent-accent dark:border-zinc-700"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">
                    {benefit.name}
                  </span>
                  {!isRecognizedBenefit(benefit.id) && (
                    <span className="text-xs text-amber-600 dark:text-amber-400">
                      (display only)
                    </span>
                  )}
                </label>
              ))}
            </div>
          )}
          {hasUnrecognizedBenefit && (
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
              This item includes a display-only benefit — buying it won't have
              that effect.
            </p>
          )}
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
