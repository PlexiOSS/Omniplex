"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type { VoteCreditTier } from "@/lib/arcadia/types";

const TARGET_TYPES = ["bot", "server"] as const;

interface VoteCreditTierEditModalProps {
  loginToken: string;
  /** Omit for create; pass an existing tier for edit. */
  tier?: VoteCreditTier;
  onClose: () => void;
  onSaved: () => void;
}

export function VoteCreditTierEditModal({
  loginToken,
  tier,
  onClose,
  onSaved,
}: VoteCreditTierEditModalProps) {
  const isEdit = !!tier;
  const [id, setId] = useState(tier?.id ?? "");
  const [targetType, setTargetType] = useState(tier?.target_type ?? "bot");
  const [position, setPosition] = useState(tier ? String(tier.position) : "0");
  const [votes, setVotes] = useState(tier ? String(tier.votes) : "");
  const [dollars, setDollars] = useState(
    tier ? (tier.cents / 100).toFixed(2) : "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    const cents = Math.round(Number(dollars) * 100);
    const voteCount = Number(votes);
    const pos = Number(position);

    if (
      !id.trim() ||
      Number.isNaN(cents) ||
      cents < 0 ||
      Number.isNaN(voteCount) ||
      voteCount < 0 ||
      Number.isNaN(pos)
    ) {
      setError(
        "ID, a valid vote count, and a valid credit amount are required.",
      );
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        id: id.trim(),
        target_type: targetType,
        position: pos,
        cents,
        votes: voteCount,
      };
      if (isEdit) {
        await arcadia.voteCreditTiers.edit(loginToken, payload);
      } else {
        await arcadia.voteCreditTiers.create(loginToken, payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ArcadiaError ? err.message : "Failed to save.");
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={isEdit ? "Edit Tier" : "Create Tier"}>
      <div className="space-y-4">
        <Input
          id="tier-id"
          label="ID"
          value={id}
          onChange={(e) => setId(e.target.value)}
          disabled={isEdit}
          required
        />

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="tier-target-type"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Target type
          </label>
          <select
            id="tier-target-type"
            value={targetType}
            onChange={(e) => setTargetType(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
          >
            {TARGET_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            id="tier-votes"
            label="Votes required"
            type="number"
            min={0}
            value={votes}
            onChange={(e) => setVotes(e.target.value)}
            required
          />
          <Input
            id="tier-cents"
            label="Credit (dollars)"
            type="number"
            min={0}
            step={0.01}
            value={dollars}
            onChange={(e) => setDollars(e.target.value)}
            required
          />
        </div>

        <Input
          id="tier-position"
          label="Position"
          type="number"
          min={0}
          value={position}
          onChange={(e) => setPosition(e.target.value)}
        />
        <p className="-mt-3 text-xs text-zinc-400 dark:text-zinc-600">
          Display order — tiers push each other down on conflict, so exact
          values don't need to be unique up front.
        </p>

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
