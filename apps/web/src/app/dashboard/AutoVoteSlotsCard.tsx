"use client";

import { users } from "@omniplex/core/api";
import { ApiError } from "@omniplex/core/api/client";
import type { AutoVoteStatus } from "@omniplex/core/api/types";
import { Button } from "@omniplex/ui/Button";
import { Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { formatCents } from "@/components/billing/PromoCodeField";
import { FormMessage, SettingsCard } from "./manage/ManageShell";

const INCLUDED = 3;

export function AutoVoteSlotsCard({
  status,
  userId,
  token,
  inUse,
  onChanged,
}: {
  status: AutoVoteStatus;
  userId: string;
  token: string;
  inUse: number;
  onChanged: () => Promise<void>;
}) {
  const [extra, setExtra] = useState(status.extra_slots);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    setExtra(status.extra_slots);
  }, [status.extra_slots]);

  const unit = status.billing_interval === "year" ? "year" : "month";
  const each = formatCents(status.slot_price_cents);
  const diff = extra - status.extra_slots;
  const total = INCLUDED + extra;
  const tooFew = total < inUse;

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(null);
    try {
      await users.setAutoVoteSlots(userId, extra, token);
      await onChanged();
      setSaved(`Saved. You now have ${total} slots.`);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Couldn't change your slots.",
      );
    } finally {
      setSaving(false);
    }
  }

  const stepClass =
    "flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition-colors hover:border-accent/40 hover:text-accent disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:text-zinc-300";

  return (
    <SettingsCard
      title="Listing slots"
      description={`${INCLUDED} are included. Extra slots are ${each} a ${unit} each, up to ${INCLUDED + status.max_extra_slots} listings in total.`}
      footer={
        <>
          <FormMessage error={error} success={saved} />
          <Button
            variant="primary"
            size="sm"
            loading={saving}
            disabled={diff === 0 || tooFew}
            onClick={save}
          >
            {diff > 0
              ? `Add ${diff} slot${diff === 1 ? "" : "s"}`
              : diff < 0
                ? `Remove ${-diff} slot${diff === -1 ? "" : "s"}`
                : "Save"}
          </Button>
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="One fewer extra slot"
            disabled={saving || extra === 0}
            onClick={() => setExtra(extra - 1)}
            className={stepClass}
          >
            <Minus size={14} />
          </button>
          <span className="w-10 text-center text-lg font-semibold tabular-nums text-zinc-950 dark:text-zinc-50">
            {extra}
          </span>
          <button
            type="button"
            aria-label="One more extra slot"
            disabled={saving || extra >= status.max_extra_slots}
            onClick={() => setExtra(extra + 1)}
            className={stepClass}
          >
            <Plus size={14} />
          </button>
        </div>
        <div className="text-sm text-zinc-600 dark:text-zinc-300">
          <p>
            {total} listings in total
            {extra > 0 &&
              ` · ${formatCents(extra * status.slot_price_cents)} a ${unit} for extra slots`}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {tooFew
              ? `You have ${inUse} listings set up. Remove some before dropping to ${total} slots.`
              : diff > 0
                ? `You're charged for the rest of this ${unit} now, then ${formatCents(extra * status.slot_price_cents)} each ${unit} with your subscription.`
                : diff < 0
                  ? "The unused time on removed slots comes off your next invoice."
                  : `${inUse} of ${INCLUDED + status.extra_slots} in use.`}
          </p>
        </div>
      </div>
    </SettingsCard>
  );
}
