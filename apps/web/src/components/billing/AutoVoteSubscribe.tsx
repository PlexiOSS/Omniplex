"use client";

import { users } from "@omniplex/core/api";
import { ApiError } from "@omniplex/core/api/client";
import type { PromoCodePreview } from "@omniplex/core/api/types";
import { Button } from "@omniplex/ui/Button";
import { Check, Repeat } from "lucide-react";
import { useState } from "react";
import {
  formatCents,
  PromoCodeField,
} from "@/components/billing/PromoCodeField";
import { SignInLink } from "@/components/ui/SignInLink";

export function AutoVoteSubscribe({
  priceCents,
  yearlyPriceCents,
  includedSlots,
  slotPriceCents,
  userId,
  token,
  initialPromo,
}: {
  priceCents: number;
  yearlyPriceCents: number;
  includedSlots: number;
  slotPriceCents: number;
  userId?: string;
  token?: string;
  initialPromo?: string | null;
}) {
  const [plan, setPlan] = useState<"monthly" | "yearly">("monthly");
  const [promo, setPromo] = useState<PromoCodePreview | null>(null);
  const [billing, setBilling] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);

  const yearly = plan === "yearly";
  const price = formatCents(yearly ? yearlyPriceCents : priceCents);
  const unit = yearly ? "year" : "month";
  const yearlySaving = Math.round(
    100 - (yearlyPriceCents / (priceCents * 12)) * 100,
  );

  async function subscribe() {
    if (!userId || !token) return;
    setBilling(true);
    setBillingError(null);
    try {
      const { url } = await users.startAutoVoteCheckout(
        userId,
        token,
        promo?.code,
        plan,
      );
      window.location.href = url;
    } catch (err) {
      setBillingError(
        err instanceof ApiError ? err.message : "Couldn't open checkout.",
      );
      setBilling(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent ring-1 ring-accent/15">
            <Repeat size={20} />
          </span>
          <div className="min-w-0">
            <h2 className="font-semibold text-zinc-950 dark:text-zinc-50">
              Never miss a vote
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              Auto-vote votes for up to {includedSlots} bots or servers for you
              as soon as your cooldown ends, always or on a schedule you choose.
            </p>
          </div>
        </div>
        <ul className="mt-5 grid gap-2 text-sm text-zinc-600 sm:grid-cols-2 dark:text-zinc-300">
          {[
            "Votes count toward the listing's votes and ranking",
            `${includedSlots} listings included, more for ${formatCents(slotPriceCents)} a month each`,
            "Skips listings whose owners turned automatic votes off",
            "No captchas to solve",
          ].map((line) => (
            <li key={line} className="flex items-start gap-2">
              <Check size={15} className="mt-0.5 shrink-0 text-accent" />
              {line}
            </li>
          ))}
        </ul>
        <p className="mt-4 rounded-xl bg-zinc-50 px-3 py-2.5 text-xs text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
          Automatic votes don&apos;t count toward the voter leaderboard, voting
          badges like Active Voter and Top Voter, or the listing&apos;s vote
          credits. Those stay for votes you cast yourself.
        </p>
        <div className="mt-5 inline-flex rounded-xl border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-950">
          {(["monthly", "yearly"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={plan === value}
              onClick={() => setPlan(value)}
              disabled={billing}
              className={[
                "inline-flex h-8 items-center gap-2 rounded-lg px-3 text-xs font-medium transition-colors",
                plan === value
                  ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
              ].join(" ")}
            >
              {value === "monthly" ? "Monthly" : "Yearly"}
              {value === "yearly" && yearlySaving > 0 && (
                <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                  Save {yearlySaving}%
                </span>
              )}
            </button>
          ))}
        </div>
        {userId && token && (
          <div className="mt-4">
            <PromoCodeField
              userId={userId}
              token={token}
              product="autovote"
              plan={plan}
              value={promo}
              onChange={setPromo}
              disabled={billing}
              initialCode={initialPromo}
            />
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 bg-zinc-50/60 px-5 py-3 sm:px-6 dark:border-zinc-800 dark:bg-zinc-950/40">
        <span className="text-sm text-zinc-600 dark:text-zinc-300">
          {promo ? (
            <>
              <span className="mr-1.5 text-zinc-400 line-through">{price}</span>
              <span className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                {formatCents(promo.total_cents)}
              </span>{" "}
              {promo.duration === "forever" ? `/ ${unit}` : `first ${unit}`} ·
              cancel anytime
            </>
          ) : (
            <>
              <span className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                {price}
              </span>{" "}
              / {unit} · cancel anytime
            </>
          )}
        </span>
        {userId && token ? (
          <Button
            variant="primary"
            size="sm"
            loading={billing}
            onClick={subscribe}
          >
            Subscribe
          </Button>
        ) : (
          <SignInLink>
            <Button variant="primary" size="sm">
              Sign in to subscribe
            </Button>
          </SignInLink>
        )}
        {billingError && (
          <p className="w-full text-xs text-red-600 dark:text-red-400">
            {billingError}
          </p>
        )}
      </div>
    </section>
  );
}
