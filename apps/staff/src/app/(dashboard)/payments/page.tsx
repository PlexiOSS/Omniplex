"use client";

import { SITE_URL } from "@omniplex/core/api/config";
import type { AutoVoteTarget } from "@omniplex/core/api/types";
import { autoVoteState, isAlways, waitLabel } from "@omniplex/core/autoVote";
import { formatCents } from "@omniplex/core/promo";
import { formatRelativeTime } from "@omniplex/core/utils/format";
import { Avatar } from "@omniplex/ui/Avatar";
import { Badge } from "@omniplex/ui/Badge";
import { Button } from "@omniplex/ui/Button";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAdmin } from "@/app/AdminContext";
import { AdminPageHeader } from "@/app/AdminPageHeader";
import { AdminEmptyState } from "@/components/admin/AdminListRow";
import { AdminError, AdminLoading } from "@/components/admin/AdminState";
import {
  AdminFilterChips,
  AdminToolbar,
} from "@/components/admin/AdminToolbar";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";

function premiumLength(hours: number) {
  if (hours % 24 !== 0) return `${hours} hours`;
  const days = hours / 24;
  return days === 1 ? "1 day" : `${days} days`;
}

interface StaffPayment {
  provider: string;
  external_id: string;
  user_id: string;
  product_id: string;
  for_type: string;
  for_id: string;
  fulfilled_at: string;
  revoked_at: string | null;
  revoke_reason: string | null;
  premium_hours?: number | null;
  credits_used: number | null;
  credit_discount_cents: number | null;
  credit_state: string | null;
  promo_code: string | null;
}

interface AutoVoteStaffEntry {
  user_id: string;
  status: string;
  active: boolean;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  subscribed_at: string | null;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  auto_votes_30d: number;
  targets: AutoVoteTarget[];
}

type Tab = "premium" | "autovote";

const inputClass =
  "h-9 min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none transition-colors placeholder:text-zinc-400 focus:border-accent/50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50";

function stripeUrl(path: string) {
  return `https://dashboard.stripe.com/${path}`;
}

function PremiumPayments({ loginToken }: { loginToken: string }) {
  const [payments, setPayments] = useState<StaffPayment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [applied, setApplied] = useState("");
  const [revokedOnly, setRevokedOnly] = useState(false);

  const load = useCallback(() => {
    setError(null);
    setPayments(null);
    const params = new URLSearchParams();
    if (applied) params.set("user_id", applied);
    if (revokedOnly) params.set("revoked", "true");
    const qs = params.toString();
    arcadia
      .popplioStaff<{ payments: StaffPayment[] }>(
        loginToken,
        "GET",
        `/staff/payments${qs ? `?${qs}` : ""}`,
      )
      .then(({ json }) => setPayments(json?.payments ?? []))
      .catch((err) =>
        setError(
          err instanceof ArcadiaError
            ? err.message
            : "Failed to load payments.",
        ),
      );
  }, [loginToken, applied, revokedOnly]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <form
        className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center"
        onSubmit={(e) => {
          e.preventDefault();
          setApplied(query.trim());
        }}
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buyer, bot or server ID"
          aria-label="Buyer, bot or server ID"
          className={inputClass}
        />
        <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={revokedOnly}
            onChange={(e) => setRevokedOnly(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 accent-accent dark:border-zinc-700"
          />
          Refunded or disputed only
        </label>
        <Button type="submit" variant="secondary" size="sm">
          Search
        </Button>
      </form>

      {error ? (
        <AdminError message={error} onRetry={load} />
      ) : !payments ? (
        <AdminLoading />
      ) : (
        <div className="mt-4 divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {payments.length === 0 && (
            <AdminEmptyState message="No premium payments match." />
          )}
          {payments.map((p) => (
            <div
              key={`${p.provider}-${p.external_id}`}
              className="flex flex-wrap items-center gap-3 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-1.5 text-sm">
                  <Link
                    href={`${SITE_URL}/${p.for_type}s/${p.for_id}`}
                    className="font-mono font-medium text-zinc-950 hover:text-accent dark:text-zinc-50"
                  >
                    {p.for_type} {p.for_id}
                  </Link>
                  <Badge variant="info">
                    {p.provider === "stripe" ? "Stripe" : "PayPal"}
                  </Badge>
                  {p.revoke_reason && (
                    <Badge variant="danger">
                      {p.revoke_reason === "disputed" ? "Disputed" : "Refunded"}
                    </Badge>
                  )}
                  {p.premium_hours != null && (
                    <Badge>{premiumLength(p.premium_hours)}</Badge>
                  )}
                  {p.promo_code && (
                    <Badge variant="success">{p.promo_code}</Badge>
                  )}
                  {p.credits_used != null && (
                    <Badge>
                      {p.credits_used} credits
                      {p.credit_discount_cents != null &&
                        ` (${formatCents(p.credit_discount_cents)})`}
                      {p.credit_state === "refunded" && ", returned"}
                    </Badge>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  Bought by{" "}
                  <Link
                    href={`/activity?actor=${p.user_id}`}
                    className="font-mono hover:text-accent"
                  >
                    {p.user_id}
                  </Link>{" "}
                  · {formatRelativeTime(p.fulfilled_at)}
                  {p.revoked_at &&
                    ` · taken back ${formatRelativeTime(p.revoked_at)}`}
                </p>
              </div>
              {p.provider === "stripe" && (
                <a
                  href={stripeUrl(`checkout/sessions/${p.external_id}`)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs text-zinc-500 hover:text-accent dark:text-zinc-400"
                >
                  Stripe <ExternalLink size={12} />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function targetStatus(t: AutoVoteTarget, active: boolean, now: number) {
  if (t.last_skip_reason) {
    return {
      label: "Skipped",
      tone: "danger" as const,
      detail: t.last_skip_reason,
    };
  }
  const { state, waitMs } = autoVoteState(t, active, now);
  switch (state) {
    case "unsubscribed":
      return {
        label: "Not running",
        tone: "default" as const,
        detail: "No active subscription",
      };
    case "cooldown":
      return {
        label: "Cooldown",
        tone: "warning" as const,
        detail: `Next vote in about ${waitLabel(waitMs)}`,
      };
    case "outside":
      return {
        label: "Outside schedule",
        tone: "warning" as const,
        detail: "Waiting for the schedule to open",
      };
    default:
      return {
        label: "Ready",
        tone: "success" as const,
        detail: "Votes on the next run",
      };
  }
}

function AutoVoteOverview({ loginToken }: { loginToken: string }) {
  const [entries, setEntries] = useState<AutoVoteStaffEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(() => {
    setError(null);
    setNow(Date.now());
    arcadia
      .popplioStaff<{ entries: AutoVoteStaffEntry[] }>(
        loginToken,
        "GET",
        "/staff/auto-vote",
      )
      .then(({ json }) => setEntries(json?.entries ?? []))
      .catch((err) =>
        setError(
          err instanceof ArcadiaError
            ? err.message
            : "Failed to load Auto-vote.",
        ),
      );
  }, [loginToken]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <AdminError message={error} onRetry={load} />;
  if (!entries) return <AdminLoading />;

  return (
    <div className="mt-6 space-y-3">
      {entries.length === 0 && (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <AdminEmptyState message="Nobody has set up Auto-vote yet." />
        </div>
      )}
      {entries.map((e) => (
        <div
          key={e.user_id}
          className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/activity?actor=${e.user_id}`}
              className="font-mono text-sm font-medium text-zinc-950 hover:text-accent dark:text-zinc-50"
            >
              {e.user_id}
            </Link>
            <Badge variant={e.active ? "success" : "default"}>
              {e.status || "Never subscribed"}
            </Badge>
            {e.cancel_at_period_end && (
              <Badge variant="warning">Cancels at period end</Badge>
            )}
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {e.auto_votes_30d} automatic votes in 30 days
              {e.current_period_end &&
                ` · period ends ${new Date(e.current_period_end).toLocaleDateString()}`}
            </span>
            {e.stripe_subscription_id && (
              <a
                href={stripeUrl(`subscriptions/${e.stripe_subscription_id}`)}
                target="_blank"
                rel="noreferrer"
                className="ml-auto flex items-center gap-1 text-xs text-zinc-500 hover:text-accent dark:text-zinc-400"
              >
                Stripe <ExternalLink size={12} />
              </a>
            )}
          </div>
          {e.targets.length === 0 ? (
            <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
              No listings saved.
            </p>
          ) : (
            <div className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800">
              {e.targets.map((t) => {
                const s = targetStatus(t, e.active, now);
                return (
                  <div
                    key={`${t.target_type}-${t.target_id}`}
                    className="flex flex-wrap items-center gap-3 py-2"
                  >
                    <Avatar src={t.avatar} alt={t.name} size={24} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-zinc-950 dark:text-zinc-50">
                        {t.name}{" "}
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          {t.target_type} ·{" "}
                          {isAlways(t) ? "whenever possible" : "on a schedule"}
                          {t.last_voted_at &&
                            ` · last voted ${formatRelativeTime(t.last_voted_at)}`}
                        </span>
                      </p>
                      <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                        {s.detail}
                      </p>
                    </div>
                    <Badge variant={s.tone}>{s.label}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function PaymentsPage() {
  const { loginToken, hasPerm } = useAdmin();
  const [tab, setTab] = useState<Tab>("premium");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
      <AdminPageHeader
        title="Payments"
        description="Premium purchases, with the credits and promo codes used and any refund or dispute, and every Auto-vote subscriber with what each of their listings is waiting for."
      />

      {!hasPerm("view_payments") ? (
        <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-300">
          You need the View Payments permission to see payments.
        </p>
      ) : (
        <>
          <AdminToolbar>
            <AdminFilterChips
              value={tab}
              onChange={setTab}
              chips={[
                { key: "premium", label: "Premium" },
                { key: "autovote", label: "Auto-vote" },
              ]}
            />
          </AdminToolbar>
          {tab === "premium" ? (
            <PremiumPayments loginToken={loginToken} />
          ) : (
            <AutoVoteOverview loginToken={loginToken} />
          )}
        </>
      )}
    </div>
  );
}
