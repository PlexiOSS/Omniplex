"use client";

import {
  ArrowRight,
  BadgeCheck,
  Check,
  Clock,
  Gift,
  Home,
  Lock,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  botOption,
  EntityToggle,
  type ListingEntity,
  ListingPicker,
  serverOption,
} from "@/components/billing/ListingPicker";
import { PromoCodeField } from "@/components/billing/PromoCodeField";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { SignInLink } from "@/components/ui/SignInLink";
import { useAuth } from "@/hooks/useAuth";
import { useMe } from "@/hooks/useMe";
import { payments, votes } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import type {
  BoosterStatus,
  BotType,
  PaymentPlan,
  PromoCodePreview,
} from "@/lib/api/types";

type Provider = "stripe" | "paypal";

const PERKS = [
  {
    icon: Clock,
    title: "4-hour vote cooldown",
    body: "Voters can come back three times as often as the standard 12 hours.",
  },
  {
    icon: BadgeCheck,
    title: "Premium badge",
    body: "Shown on the listing's card and its page.",
  },
  {
    icon: Home,
    title: "Homepage highlight",
    body: "Eligible for the Premium row in the homepage highlights.",
  },
];

function planMonths(hours: number): number {
  return Math.max(1, Math.round(hours / 24 / 30));
}

function durationLabel(hours: number): string {
  const days = Math.round(hours / 24);
  if (days < 28) return `${days} ${days === 1 ? "day" : "days"}`;
  const months = planMonths(hours);
  if (months >= 12 && months % 12 === 0) {
    const years = months / 12;
    return `${years} ${years === 1 ? "year" : "years"}`;
  }
  return `${months} ${months === 1 ? "month" : "months"}`;
}

function ineligibleReason(
  type: BotType | string,
  premium: boolean,
): string | null {
  if (premium) return "Already premium";
  if (type === "approved" || type === "certified") return null;
  if (type === "denied") return "Denied";
  return "In review";
}

function PremiumPageInner() {
  const searchParams = useSearchParams();
  const { session, isAuthenticated, loading: authLoading } = useAuth();
  const { me, loading: meLoading } = useMe(session);

  const [plans, setPlans] = useState<PaymentPlan[] | null>(null);
  const [creditRules, setCreditRules] = useState({ perCent: 0, share: 0 });
  const [availableCredits, setAvailableCredits] = useState(0);
  const [useCredits, setUseCredits] = useState(false);
  const [paypalAvailable, setPaypalAvailable] = useState(false);
  const [stripeAvailable, setStripeAvailable] = useState(false);
  const [booster, setBooster] = useState<BoosterStatus | null>(null);

  const [entity, setEntity] = useState<ListingEntity>(
    searchParams.get("server") ? "server" : "bot",
  );
  const [botId, setBotId] = useState(searchParams.get("bot") ?? "");
  const [serverId, setServerId] = useState(searchParams.get("server") ?? "");
  const [planId, setPlanId] = useState("");
  const [submitting, setSubmitting] = useState<Provider | "redeem" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [promo, setPromo] = useState<PromoCodePreview | null>(null);

  useEffect(() => {
    payments.getPlans().then((res) => {
      setPlans(res.plans);
      setCreditRules({
        perCent: res.credits_per_cent ?? 0,
        share: res.max_credit_share ?? 0,
      });
      setPlanId((current) => current || (res.plans[0]?.id ?? ""));
    });
    payments
      .getPaypalMeta()
      .then(() => setPaypalAvailable(true))
      .catch(() => setPaypalAvailable(false));
    payments
      .getStripeMeta()
      .then((meta) => setStripeAvailable(Boolean(meta.stripe_public_key)))
      .catch(() => setStripeAvailable(false));
  }, []);

  useEffect(() => {
    if (!session) return;
    payments
      .getBoosterStatus(session.user_id)
      .then(setBooster)
      .catch(() => setBooster(null));
  }, [session]);

  const botOptions = (me?.user_bots ?? []).map((b) =>
    botOption(b, ineligibleReason(b.type, b.premium)),
  );
  const seenServers = new Set<string>();
  const serverOptions = (me?.user_teams ?? [])
    .flatMap((team) => team.entities?.servers ?? [])
    .filter((s) => {
      if (seenServers.has(s.server_id)) return false;
      seenServers.add(s.server_id);
      return true;
    })
    .map((s) => serverOption(s, ineligibleReason(s.type, s.premium)));
  const sortEligibleFirst = (
    a: { disabledReason?: string | null },
    b: typeof a,
  ) => Number(!!a.disabledReason) - Number(!!b.disabledReason);
  botOptions.sort(sortEligibleFirst);
  serverOptions.sort(sortEligibleFirst);

  const options = entity === "bot" ? botOptions : serverOptions;
  const eligible = options.filter((o) => !o.disabledReason);

  const firstBotId = botOptions.find((o) => !o.disabledReason)?.id ?? "";
  const firstServerId = serverOptions.find((o) => !o.disabledReason)?.id ?? "";

  useEffect(() => {
    if (firstBotId) setBotId((current) => current || firstBotId);
    if (firstServerId) setServerId((current) => current || firstServerId);
  }, [firstBotId, firstServerId]);

  const targetId = entity === "bot" ? botId : serverId;
  const target = eligible.find((o) => o.id === targetId);
  const plan = plans?.find((p) => p.id === planId);

  useEffect(() => {
    setUseCredits(false);
    if (!targetId) {
      setAvailableCredits(0);
      return;
    }
    votes
      .getRedeemLogs(entity, targetId)
      .then((summary) => setAvailableCredits(summary.available_credits ?? 0))
      .catch(() => setAvailableCredits(0));
  }, [entity, targetId]);

  const priceCents = plan ? Math.round(plan.price * 100) : 0;
  const discountCents =
    creditRules.perCent > 0
      ? Math.min(
          Math.floor(availableCredits / creditRules.perCent),
          Math.floor(priceCents * creditRules.share),
        )
      : 0;
  const creditsToUse = discountCents * creditRules.perCent;
  const appliedDiscount = useCredits ? discountCents : 0;
  const totalCents = promo ? promo.total_cents : priceCents - appliedDiscount;
  const bestValueId =
    plans && plans.length > 1
      ? [...plans].sort(
          (a, b) =>
            a.price / planMonths(a.time_period) -
            b.price / planMonths(b.time_period),
        )[0].id
      : null;

  async function handleCheckout(provider: Provider) {
    if (!session || !target || !planId) return;
    setSubmitting(provider);
    setError(null);
    try {
      const { url } =
        provider === "stripe"
          ? await payments.createStripeCheckout(
              session.user_id,
              planId,
              entity,
              target.id,
              session.token,
              useCredits ? creditsToUse : 0,
              promo?.code,
            )
          : await payments.createPaypalOrder(
              session.user_id,
              planId,
              entity,
              target.id,
              session.token,
              useCredits ? creditsToUse : 0,
            );
      window.location.href = url;
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to start checkout.",
      );
      setSubmitting(null);
    }
  }

  async function handleRedeemBooster() {
    if (!session || !target || !planId) return;
    setSubmitting("redeem");
    setError(null);
    try {
      await payments.redeemBoosterOffer(
        session.user_id,
        planId,
        entity,
        target.id,
        session.token,
      );
      window.location.href = "/payments/success";
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to redeem booster offer.",
      );
      setSubmitting(null);
    }
  }

  const canRedeemBooster = booster?.is_booster && planId === "bronze";
  const ready = !!target && !!plan && submitting === null;

  return (
    <Container className="py-10">
      <PageHeader
        centered
        icon={Sparkles}
        title="Premium"
        description={
          <>
            Upgrade one of your bots or servers. Every plan includes the same
            perks; longer plans just cost less per month.
          </>
        }
      />

      <div className="mx-auto grid max-w-5xl gap-3 sm:grid-cols-3">
        {PERKS.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="flex gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <Icon size={18} className="mt-0.5 shrink-0 text-accent" />
            <div>
              <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                {title}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                {body}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-10 grid max-w-5xl gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-8">
          <section>
            <h2 className="mb-3 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
              1. Choose a plan
            </h2>
            {!plans ? (
              <div className="grid gap-3 sm:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-32 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800"
                  />
                ))}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-3">
                {plans.map((p) => {
                  const selected = planId === p.id;
                  const months = planMonths(p.time_period);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPlanId(p.id)}
                      aria-pressed={selected}
                      className={[
                        "relative flex min-w-0 flex-col rounded-xl border bg-white p-4 text-left transition-colors dark:bg-zinc-900",
                        selected
                          ? "border-accent ring-1 ring-accent"
                          : "border-zinc-200 hover:border-accent/40 dark:border-zinc-800",
                      ].join(" ")}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                          {p.name.replace(/ plan$/i, "")}
                        </span>
                        {p.id === bestValueId ? (
                          <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">
                            Best value
                          </span>
                        ) : (
                          selected && (
                            <Check size={14} className="text-accent" />
                          )
                        )}
                      </span>
                      <span className="mt-2 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
                        ${p.price.toFixed(2)}
                      </span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        for {durationLabel(p.time_period)}
                        {months > 1 &&
                          ` · $${(p.price / months).toFixed(2)}/mo`}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                2. Choose what to upgrade
              </h2>
              <EntityToggle value={entity} onChange={setEntity} />
            </div>
            {authLoading || meLoading ? (
              <div className="h-12 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
            ) : !isAuthenticated ? (
              <div className="rounded-xl border border-dashed border-zinc-300 p-6 text-center dark:border-zinc-700">
                <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
                  Sign in to see which of your {entity}s can be upgraded.
                </p>
                <SignInLink>
                  <Button variant="primary" size="sm">
                    Sign in
                  </Button>
                </SignInLink>
              </div>
            ) : options.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                You don&apos;t have any {entity}s listed yet.{" "}
                <Link
                  href={entity === "bot" ? "/bots/add" : "/servers/add"}
                  className="text-accent hover:underline"
                >
                  Add one
                </Link>
              </div>
            ) : (
              <>
                <ListingPicker
                  entity={entity}
                  options={options}
                  value={target ? target.id : ""}
                  onChange={entity === "bot" ? setBotId : setServerId}
                />
                {eligible.length === 0 && (
                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                    None of your {entity}s can be upgraded right now. A {entity}{" "}
                    has to be approved or certified, and not already premium.
                  </p>
                )}
              </>
            )}
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="space-y-3 p-5">
              <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                Summary
              </h2>
              <div className="flex items-center gap-3">
                {target ? (
                  <>
                    <Avatar src={target.avatar} alt={target.name} size={32} />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                      {target.name}
                    </span>
                  </>
                ) : (
                  <span className="text-sm text-zinc-400 dark:text-zinc-500">
                    No {entity} chosen
                  </span>
                )}
              </div>
              <dl className="space-y-1.5 border-t border-zinc-100 pt-3 text-sm dark:border-zinc-800">
                <div className="flex justify-between gap-2">
                  <dt className="text-zinc-500 dark:text-zinc-400">Plan</dt>
                  <dd className="text-zinc-950 dark:text-zinc-50">
                    {plan ? plan.name.replace(/ plan$/i, "") : "None"}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-zinc-500 dark:text-zinc-400">Length</dt>
                  <dd className="text-zinc-950 dark:text-zinc-50">
                    {plan ? durationLabel(plan.time_period) : "None"}
                  </dd>
                </div>
                {appliedDiscount > 0 && (
                  <div className="flex justify-between gap-2 text-emerald-600 dark:text-emerald-400">
                    <dt>Credits ({creditsToUse})</dt>
                    <dd>-${(appliedDiscount / 100).toFixed(2)}</dd>
                  </div>
                )}
                {promo && promo.discount_cents > 0 && (
                  <div className="flex justify-between gap-2 text-emerald-600 dark:text-emerald-400">
                    <dt className="truncate">Code {promo.code}</dt>
                    <dd>-${(promo.discount_cents / 100).toFixed(2)}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-2 pt-1.5 font-semibold">
                  <dt className="text-zinc-950 dark:text-zinc-50">Total</dt>
                  <dd className="text-zinc-950 dark:text-zinc-50">
                    {plan ? (
                      <>
                        {totalCents < priceCents && (
                          <span className="mr-1.5 font-normal text-zinc-400 line-through">
                            ${plan.price.toFixed(2)}
                          </span>
                        )}
                        ${(totalCents / 100).toFixed(2)}
                      </>
                    ) : (
                      "None"
                    )}
                  </dd>
                </div>
              </dl>

              {target && plan && discountCents > 0 && (
                <label
                  className={[
                    "flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition-colors",
                    useCredits
                      ? "border-accent/40 bg-accent/5"
                      : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700",
                  ].join(" ")}
                >
                  <input
                    type="checkbox"
                    checked={useCredits}
                    onChange={(e) => setUseCredits(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-zinc-300 accent-accent dark:border-zinc-700"
                  />
                  <span className="min-w-0">
                    <span className="block font-medium text-zinc-900 dark:text-zinc-100">
                      Use {creditsToUse} credits for $
                      {(discountCents / 100).toFixed(2)} off
                    </span>
                    <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                      {target.name} has {availableCredits} credits. Credits can
                      cover up to {Math.round(creditRules.share * 100)}% of the
                      price. They&apos;re returned if you don&apos;t finish
                      paying.
                    </span>
                  </span>
                </label>
              )}

              {session && plan && stripeAvailable && (
                <PromoCodeField
                  userId={session.user_id}
                  token={session.token}
                  product="premium"
                  plan={planId}
                  credits={useCredits ? creditsToUse : 0}
                  value={promo}
                  onChange={setPromo}
                  disabled={submitting !== null}
                />
              )}

              {canRedeemBooster && (
                <div className="flex items-start gap-2.5 rounded-lg bg-accent/5 p-3 text-xs text-zinc-700 dark:text-zinc-300">
                  <Gift size={14} className="mt-0.5 shrink-0 text-accent" />
                  <div className="flex-1">
                    <p>
                      You boost our Discord server, so you can redeem Bronze for
                      free.
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={submitting === "redeem"}
                      disabled={!ready}
                      onClick={handleRedeemBooster}
                      className="mt-2"
                    >
                      Redeem free
                    </Button>
                  </div>
                </div>
              )}

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-400">
                  {error}
                </p>
              )}

              {isAuthenticated && (
                <div className="flex flex-col gap-2">
                  {stripeAvailable && (
                    <Button
                      variant="primary"
                      loading={submitting === "stripe"}
                      disabled={!ready}
                      onClick={() => handleCheckout("stripe")}
                    >
                      Pay with card
                    </Button>
                  )}
                  {paypalAvailable && (
                    <Button
                      variant={stripeAvailable ? "secondary" : "primary"}
                      loading={submitting === "paypal"}
                      disabled={!ready || !!promo}
                      onClick={() => handleCheckout("paypal")}
                    >
                      Pay with PayPal
                    </Button>
                  )}
                  {paypalAvailable && promo && (
                    <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
                      Promo codes work with card payments only.
                    </p>
                  )}
                  {!stripeAvailable && !paypalAvailable && (
                    <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
                      Checkout isn&apos;t available right now. Check back later.
                    </p>
                  )}
                </div>
              )}
            </div>
            <p className="flex items-center gap-1.5 border-t border-zinc-100 bg-zinc-50/60 px-5 py-3 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-400">
              <Lock size={12} className="shrink-0" />
              Paid through Stripe or PayPal. Premium applies automatically.
            </p>
          </div>

          <div className="mt-4 space-y-2 text-xs text-zinc-500 dark:text-zinc-400">
            <Link
              href={`/shop${targetId ? `?${entity}=${targetId}` : ""}`}
              className="group flex items-center justify-between rounded-lg px-1 py-1 transition-colors hover:text-accent"
            >
              Spend vote credits on premium days instead
              <ArrowRight
                size={12}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>
            <Link
              href="/kb/premium/premium"
              className="group flex items-center justify-between rounded-lg px-1 py-1 transition-colors hover:text-accent"
            >
              How premium and checkout work
              <ArrowRight
                size={12}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          </div>
        </aside>
      </div>
    </Container>
  );
}

export default function PremiumPage() {
  return (
    <Suspense>
      <PremiumPageInner />
    </Suspense>
  );
}
