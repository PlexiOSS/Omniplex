"use client";

import { Tag, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { payments } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import type { PromoCodePreview, PromoCodeProduct } from "@/lib/api/types";

export function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function promoSummary(preview: PromoCodePreview) {
  const off =
    preview.percent_off != null
      ? `${preview.percent_off}% off`
      : `${formatCents(preview.amount_off_cents ?? 0)} off`;
  if (preview.product !== "autovote") return off;
  if (preview.duration === "forever") return `${off} every month`;
  if (preview.duration === "repeating" && preview.duration_months) {
    return `${off} for ${preview.duration_months} ${preview.duration_months === 1 ? "month" : "months"}`;
  }
  return `${off} your first month`;
}

export function PromoCodeField({
  userId,
  token,
  product,
  plan,
  credits = 0,
  value,
  onChange,
  disabled,
}: {
  userId: string;
  token: string;
  product: PromoCodeProduct;
  plan?: string;
  credits?: number;
  value: PromoCodePreview | null;
  onChange: (preview: PromoCodePreview | null) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const appliedCode = value?.code;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const key = `${product}|${plan ?? ""}|${credits}`;
  const checkedFor = useRef("");

  async function check(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const checkedKey = key;
    setChecking(true);
    setError(null);
    try {
      const preview = await payments.checkPromoCode(
        userId,
        { code: trimmed, product, plan, credits },
        token,
      );
      checkedFor.current = checkedKey;
      onChangeRef.current(preview);
      setCode("");
      setOpen(false);
    } catch (err) {
      onChangeRef.current(null);
      setError(
        err instanceof ApiError ? err.message : "Couldn't check that code.",
      );
      setCode(trimmed);
      setOpen(true);
    } finally {
      setChecking(false);
    }
  }

  const checkRef = useRef(check);
  checkRef.current = check;

  useEffect(() => {
    if (appliedCode && checkedFor.current !== key) {
      checkRef.current(appliedCode);
    }
  }, [key, appliedCode]);

  if (value) {
    return (
      <div className="flex items-start gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs">
        <Tag
          size={14}
          className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
        />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-zinc-900 dark:text-zinc-100">
            {value.code} applied
          </p>
          <p className="text-zinc-600 dark:text-zinc-300">
            {value.description || promoSummary(value)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          disabled={disabled}
          aria-label="Remove promo code"
          className="rounded p-0.5 text-zinc-500 transition-colors hover:text-zinc-900 disabled:opacity-50 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-accent disabled:opacity-50 dark:text-zinc-400"
      >
        <Tag size={12} />
        Have a promo code?
      </button>
    );
  }

  return (
    <form
      className="space-y-1.5"
      onSubmit={(e) => {
        e.preventDefault();
        check(code);
      }}
    >
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError(null);
          }}
          placeholder="Promo code"
          aria-label="Promo code"
          aria-invalid={!!error}
          maxLength={40}
          autoComplete="off"
          spellCheck={false}
          disabled={disabled || checking}
          className={[
            "h-9 min-w-0 flex-1 rounded-lg border bg-white px-3 font-mono text-sm uppercase text-zinc-950 outline-none transition-colors placeholder:font-sans placeholder:normal-case placeholder:text-zinc-400",
            "dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-600",
            error
              ? "border-red-500"
              : "border-zinc-200 focus:border-zinc-400 dark:border-zinc-800 dark:focus:border-zinc-600",
          ].join(" ")}
        />
        <Button
          type="submit"
          variant="secondary"
          size="sm"
          loading={checking}
          disabled={disabled || !code.trim()}
        >
          Apply
        </Button>
      </div>
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </form>
  );
}
