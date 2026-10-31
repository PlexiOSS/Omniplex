"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type { PromoCodeDuration, PromoCodeProduct } from "@/lib/arcadia/types";
import { useAdmin } from "../../../../AdminContext";
import { EditorPage } from "../../../EditorPage";
import { describePromo } from "../describePromo";

const PRODUCTS: { id: PromoCodeProduct; label: string }[] = [
  { id: "premium", label: "Premium" },
  { id: "autovote", label: "Auto-vote" },
];

const DURATIONS: { id: PromoCodeDuration; label: string }[] = [
  { id: "once", label: "First month only" },
  { id: "repeating", label: "A number of months" },
  { id: "forever", label: "Every month" },
];

const checkboxClass =
  "h-4 w-4 rounded border-zinc-300 accent-accent dark:border-zinc-700";

function whole(value: string): number | null | undefined {
  if (!value.trim()) return null;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

export default function NewPromoCodePage() {
  const router = useRouter();
  const { loginToken, hasPerm } = useAdmin();

  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [products, setProducts] = useState<PromoCodeProduct[]>(["premium"]);
  const [kind, setKind] = useState<"percent" | "amount">("percent");
  const [percent, setPercent] = useState("");
  const [amount, setAmount] = useState("");
  const [duration, setDuration] = useState<PromoCodeDuration>("once");
  const [months, setMonths] = useState("3");
  const [maxUses, setMaxUses] = useState("");
  const [expires, setExpires] = useState("");
  const [oncePerUser, setOncePerUser] = useState(true);
  const [newCustomers, setNewCustomers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const back = () => router.push("/admin/shop/promo-codes");
  const autovote = products.includes("autovote");
  const percentNum = kind === "percent" ? whole(percent) : null;
  const amountCents =
    kind === "amount" && amount.trim()
      ? Math.round(Number(amount) * 100)
      : null;
  const monthsNum = duration === "repeating" ? whole(months) : null;
  const finalDuration = autovote ? duration : "once";
  const finalMonths =
    autovote && duration === "repeating" ? (monthsNum ?? null) : null;
  const hasDiscount =
    kind === "percent"
      ? !!percentNum && percentNum <= 100
      : amountCents != null && amountCents > 0;
  const preview =
    hasDiscount && products.length > 0
      ? describePromo({
          percent_off: kind === "percent" ? (percentNum ?? null) : null,
          amount_off_cents: kind === "amount" ? amountCents : null,
          duration: finalDuration,
          duration_months: finalMonths,
          products,
        })
      : null;

  if (!hasPerm("manage_promo_codes")) {
    return (
      <EditorPage
        onBack={back}
        backLabel="Back to Promo Codes"
        title="New Promo Code"
      >
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          You need the Manage Promo Codes permission to create promo codes.
        </p>
      </EditorPage>
    );
  }

  function toggleProduct(id: PromoCodeProduct) {
    setProducts((list) =>
      list.includes(id) ? list.filter((p) => p !== id) : [...list, id],
    );
  }

  async function handleSave() {
    const maxUsesNum = whole(maxUses);

    if (!/^[A-Za-z0-9_-]{3,40}$/.test(code.trim())) {
      setError("Codes are 3 to 40 letters, numbers, _ or -.");
      return;
    }
    if (products.length === 0) {
      setError("Pick at least one product.");
      return;
    }
    if (kind === "percent" && !hasDiscount) {
      setError("The percentage must be a whole number from 1 to 100.");
      return;
    }
    if (kind === "amount" && !hasDiscount) {
      setError("Enter a fixed amount off in dollars.");
      return;
    }
    if (autovote && duration === "repeating" && !monthsNum) {
      setError("Enter how many months the discount lasts.");
      return;
    }
    if (maxUsesNum === undefined) {
      setError("Total uses must be a whole number above 0, or empty.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await arcadia.promoCodes.create(loginToken, {
        code: code.trim().toUpperCase(),
        description: description.trim(),
        products,
        percent_off: kind === "percent" ? (percentNum ?? null) : null,
        amount_off_cents: kind === "amount" ? amountCents : null,
        duration: finalDuration,
        duration_months: finalMonths,
        max_redemptions: maxUsesNum,
        expires_at: expires ? new Date(expires).toISOString() : null,
        once_per_user: oncePerUser,
        new_customers_only: newCustomers,
      });
      back();
    } catch (err) {
      setError(err instanceof ArcadiaError ? err.message : "Failed to create.");
      setSaving(false);
    }
  }

  return (
    <EditorPage
      onBack={back}
      backLabel="Back to Promo Codes"
      title="New Promo Code"
      description="Creates a coupon and promotion code in Stripe. The discount can't be changed afterwards, so double check it before saving."
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="promo-code"
            label="Code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="LAUNCH25"
            maxLength={40}
            className="font-mono"
            required
          />
          <Input
            id="promo-description"
            label="Description (shown to members, optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={200}
            placeholder="Launch week offer"
          />
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Works on
          </legend>
          <div className="flex flex-wrap gap-5">
            {PRODUCTS.map((p) => (
              <label
                key={p.id}
                className="flex cursor-pointer items-center gap-2"
              >
                <input
                  type="checkbox"
                  checked={products.includes(p.id)}
                  onChange={() => toggleProduct(p.id)}
                  className={checkboxClass}
                />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  {p.label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Discount
          </legend>
          <div className="mb-3 flex flex-wrap gap-5">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="promo-kind"
                checked={kind === "percent"}
                onChange={() => setKind("percent")}
                className={checkboxClass}
              />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">
                Percentage off
              </span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="promo-kind"
                checked={kind === "amount"}
                onChange={() => setKind("amount")}
                className={checkboxClass}
              />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">
                Fixed amount off
              </span>
            </label>
          </div>
          <div className="max-w-xs">
            {kind === "percent" ? (
              <Input
                id="promo-percent"
                label="Percent off"
                type="number"
                min={1}
                max={100}
                step={1}
                placeholder="25"
                value={percent}
                onChange={(e) => setPercent(e.target.value)}
              />
            ) : (
              <Input
                id="promo-amount"
                label="Amount off (USD)"
                type="number"
                min={0.01}
                step={0.01}
                placeholder="1.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            )}
          </div>
        </fieldset>

        {autovote && (
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              On Auto-vote, the discount lasts for
            </legend>
            <div className="flex flex-wrap gap-5">
              {DURATIONS.map((d) => (
                <label
                  key={d.id}
                  className="flex cursor-pointer items-center gap-2"
                >
                  <input
                    type="radio"
                    name="promo-duration"
                    checked={duration === d.id}
                    onChange={() => setDuration(d.id)}
                    className={checkboxClass}
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">
                    {d.label}
                  </span>
                </label>
              ))}
            </div>
            {duration === "repeating" && (
              <div className="mt-3 max-w-xs">
                <Input
                  id="promo-months"
                  label="Months (1 to 36)"
                  type="number"
                  min={1}
                  max={36}
                  value={months}
                  onChange={(e) => setMonths(e.target.value)}
                />
              </div>
            )}
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              100% off for the first month only gives a free first month.
              Premium is a single payment, so this only changes Auto-vote.
            </p>
          </fieldset>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="promo-max-uses"
            label="Total uses"
            type="number"
            min={1}
            placeholder="Unlimited"
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
          />
          <Input
            id="promo-expires"
            label="Expires (your time, optional)"
            type="datetime-local"
            value={expires}
            onChange={(e) => setExpires(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2.5">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={oncePerUser}
              onChange={(e) => setOncePerUser(e.target.checked)}
              className={checkboxClass}
            />
            <span className="text-sm text-zinc-700 dark:text-zinc-300">
              Once per member
            </span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={newCustomers}
              onChange={(e) => setNewCustomers(e.target.checked)}
              className={checkboxClass}
            />
            <span className="text-sm text-zinc-700 dark:text-zinc-300">
              New customers only (never bought premium or Auto-vote)
            </span>
          </label>
        </div>

        {preview && (
          <p className="rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
            <span className="font-mono font-semibold">
              {code.trim().toUpperCase() || "CODE"}
            </span>
            : {preview}
          </p>
        )}

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={back}>
            Cancel
          </Button>
          <Button variant="primary" loading={saving} onClick={handleSave}>
            Create in Stripe
          </Button>
        </div>
      </div>
    </EditorPage>
  );
}
