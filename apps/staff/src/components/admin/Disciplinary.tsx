"use client";

import { Button } from "@omniplex/ui/Button";
import { Modal } from "@omniplex/ui/Modal";
import { useMemo, useState } from "react";
import { ArcadiaError } from "@/lib/arcadia/client";
import type {
  DisciplinaryState,
  StaffDisciplinary,
  StaffDisciplinaryType,
} from "@/lib/arcadia/types";

const STATE_STYLE: Record<DisciplinaryState, { label: string; cls: string }> = {
  pending: {
    label: "Waiting for approval",
    cls: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  active: {
    label: "Active",
    cls: "bg-red-500/10 text-red-700 dark:text-red-300",
  },
  expired: {
    label: "Ended",
    cls: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  },
  denied: {
    label: "Denied",
    cls: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  },
  revoked: {
    label: "Lifted",
    cls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
};

export function DisciplinaryStatePill({ state }: { state: DisciplinaryState }) {
  const s = STATE_STYLE[state] ?? STATE_STYLE.expired;
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${s.cls}`}
    >
      {s.label}
    </span>
  );
}

export function formatLength(secs: number) {
  const days = secs / 86400;
  if (Number.isInteger(days)) return `${days} day${days === 1 ? "" : "s"}`;
  const hours = secs / 3600;
  if (Number.isInteger(hours)) return `${hours} hour${hours === 1 ? "" : "s"}`;
  const mins = Math.round(secs / 60);
  return `${mins} minute${mins === 1 ? "" : "s"}`;
}

export function describePeriod(d: StaffDisciplinary) {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  if (d.state === "pending") {
    return d.expires_at
      ? `Will last ${formatLength(d.expires_at)} once approved`
      : "No end date once approved";
  }
  if (!d.starts_at) return null;
  if (!d.ends_at) return `From ${fmt(d.starts_at)}, no end date`;
  return `${fmt(d.starts_at)} to ${fmt(d.ends_at)}`;
}

export function describeLimits(type: StaffDisciplinaryType) {
  if (type.additory) {
    return type.perm_limits.length === 0
      ? "Doesn't change permissions"
      : `Adds ${type.perm_limits.length} permission${type.perm_limits.length === 1 ? "" : "s"}`;
  }
  return type.perm_limits.length === 0
    ? "Removes all permissions while it's active"
    : `Limits permissions to ${type.perm_limits.length} while it's active`;
}

const UNITS = [
  { key: "hours", label: "hours", secs: 3600 },
  { key: "days", label: "days", secs: 86400 },
] as const;

interface DisciplinaryFormProps {
  title: string;
  types: StaffDisciplinaryType[];
  submitLabel: string;
  reasonRequired?: boolean;
  member?: React.ReactNode;
  onClose: () => void;
  onSubmit: (body: {
    type: string;
    title: string;
    description: string;
    expiry: number | null;
  }) => Promise<void>;
}

export function DisciplinaryForm({
  title,
  types,
  submitLabel,
  reasonRequired = false,
  member,
  onClose,
  onSubmit,
}: DisciplinaryFormProps) {
  const [typeId, setTypeId] = useState(types[0]?.id ?? "");
  const [customTitle, setCustomTitle] = useState("");
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState<"hours" | "days">("days");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const type = useMemo(
    () => types.find((t) => t.id === typeId),
    [types, typeId],
  );
  const max = type?.max_expiry ?? null;

  const unitSecs = UNITS.find((u) => u.key === unit)?.secs ?? 86400;
  const parsed = amount.trim() === "" ? null : Number(amount);
  const expiry =
    parsed !== null && Number.isFinite(parsed) && parsed > 0
      ? Math.round(parsed * unitSecs)
      : null;

  let problem: string | null = null;
  if (!type) problem = "Choose a type.";
  else if (parsed !== null && expiry === null)
    problem = "The length must be more than zero.";
  else if (max !== null && expiry === null)
    problem = `This type needs a length, up to ${formatLength(max)}.`;
  else if (max !== null && expiry !== null && expiry > max)
    problem = `This type can last at most ${formatLength(max)}.`;
  else if (reasonRequired && !reason.trim()) problem = "Give a reason.";

  async function submit() {
    if (problem || !type) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        type: type.id,
        title: customTitle.trim(),
        description: reason.trim(),
        expiry,
      });
      onClose();
    } catch (err) {
      setError(
        err instanceof ArcadiaError ? err.message : "Something went wrong.",
      );
      setSubmitting(false);
    }
  }

  const fieldClass =
    "w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none transition-colors focus:border-accent/50 focus:ring-2 focus:ring-accent/15 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50";
  const labelClass = "text-sm font-medium text-zinc-700 dark:text-zinc-300";

  return (
    <Modal open onClose={() => !submitting && onClose()} title={title}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="space-y-4"
      >
        {member}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="disc-type" className={labelClass}>
            Type
          </label>
          <select
            id="disc-type"
            value={typeId}
            onChange={(e) => setTypeId(e.target.value)}
            className={fieldClass}
          >
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          {type && (
            <div className="rounded-xl bg-zinc-50 px-3 py-2.5 text-xs leading-relaxed text-zinc-600 dark:bg-zinc-800/40 dark:text-zinc-400">
              {type.description && <p>{type.description}</p>}
              <p className={type.description ? "mt-1" : ""}>
                {describeLimits(type)}.{" "}
                {type.needs_approval
                  ? "Someone ranked above the member has to approve it first."
                  : "Takes effect straight away."}
                {max !== null && ` Lasts at most ${formatLength(max)}.`}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="disc-length" className={labelClass}>
            Length{" "}
            {max === null && (
              <span className="font-normal text-zinc-400">
                (leave empty for no end date)
              </span>
            )}
          </label>
          <div className="flex gap-2">
            <input
              id="disc-length"
              type="number"
              min={0}
              step="any"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={max === null ? "No end date" : "e.g. 3"}
              className={fieldClass}
            />
            <select
              aria-label="Unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value as "hours" | "days")}
              className={`${fieldClass} w-32`}
            >
              {UNITS.map((u) => (
                <option key={u.key} value={u.key}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="disc-title" className={labelClass}>
            Title{" "}
            <span className="font-normal text-zinc-400">
              (defaults to the type's name)
            </span>
          </label>
          <input
            id="disc-title"
            value={customTitle}
            maxLength={120}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder={type?.name}
            className={fieldClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="disc-reason" className={labelClass}>
            Reason{" "}
            {!reasonRequired && (
              <span className="font-normal text-zinc-400">(optional)</span>
            )}
          </label>
          <textarea
            id="disc-reason"
            value={reason}
            maxLength={2000}
            rows={3}
            onChange={(e) => setReason(e.target.value)}
            className={`${fieldClass} resize-y`}
          />
        </div>

        {(error || (problem && amount !== "")) && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {error ?? problem}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            disabled={submitting}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={submitting}
            disabled={!!problem}
          >
            {submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
