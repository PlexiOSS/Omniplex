"use client";

import { Check, Gift, Sparkles } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Container } from "@/components/layout/Container";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { SignInLink } from "@/components/ui/SignInLink";
import { useAuth } from "@/hooks/useAuth";
import { useMe } from "@/hooks/useMe";
import { payments } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import type { BoosterStatus, PaymentPlan } from "@/lib/api/types";
import { mirroredAvatarUrl } from "@/lib/utils/assets";

type Provider = "stripe" | "paypal";
type Entity = "bot" | "server";

function durationLabel(hours: number): string {
  const days = Math.round(hours / 24);
  if (days >= 28) {
    const months = Math.round(days / 30);
    return months >= 11
      ? `${Math.round(months / 12)} year`
      : `${months} months`;
  }
  return `${days} days`;
}

function PremiumPageInner() {
  const searchParams = useSearchParams();
  const { session, isAuthenticated, loading: authLoading } = useAuth();
  const { me, loading: meLoading } = useMe(session);

  const [plans, setPlans] = useState<PaymentPlan[] | null>(null);
  const [paypalAvailable, setPaypalAvailable] = useState(false);
  const [stripeAvailable, setStripeAvailable] = useState(false);
  const [booster, setBooster] = useState<BoosterStatus | null>(null);

  const [entity, setEntity] = useState<Entity>(
    searchParams.get("server") ? "server" : "bot",
  );
  const [botId, setBotId] = useState(searchParams.get("bot") ?? "");
  const [serverId, setServerId] = useState(searchParams.get("server") ?? "");
  const [planId, setPlanId] = useState("");
  const [submitting, setSubmitting] = useState<Provider | "redeem" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    payments.getPlans().then((res) => setPlans(res.plans));
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

  const eligibleBots = (me?.user_bots ?? []).filter(
    (b) => (b.type === "approved" || b.type === "certified") && !b.premium,
  );
  const eligibleServers = (me?.user_teams ?? []).flatMap(
    (team) =>
      team.entities?.servers?.filter(
        (s) => (s.type === "approved" || s.type === "certified") && !s.premium,
      ) ?? [],
  );

  useEffect(() => {
    if (!botId && eligibleBots.length === 1) setBotId(eligibleBots[0].bot_id);
    if (!serverId && eligibleServers.length === 1) {
      setServerId(eligibleServers[0].server_id);
    }
    // eligibleBots/eligibleServers are derived fresh each render from `me`;
    // only re-run when the underlying data identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  const targetId = entity === "bot" ? botId : serverId;

  async function handleCheckout(provider: Provider) {
    if (!session || !targetId || !planId) return;
    setSubmitting(provider);
    setError(null);
    try {
      const { url } =
        provider === "stripe"
          ? await payments.createStripeCheckout(
              session.user_id,
              planId,
              entity,
              targetId,
              session.token,
            )
          : await payments.createPaypalOrder(
              session.user_id,
              planId,
              entity,
              targetId,
              session.token,
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
    if (!session || !targetId || !planId) return;
    setSubmitting("redeem");
    setError(null);
    try {
      await payments.redeemBoosterOffer(
        session.user_id,
        planId,
        entity,
        targetId,
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
  const eligibleCount =
    entity === "bot" ? eligibleBots.length : eligibleServers.length;

  return (
    <Container className="py-16">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
          <Sparkles size={22} className="text-accent" />
        </div>
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          Premium
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Give one of your bots or servers a premium badge and priority
          placement.
        </p>
      </div>

      <div className="mx-auto mt-6 flex w-fit items-center rounded-lg bg-zinc-100 p-0.5 text-sm dark:bg-zinc-800">
        {(["bot", "server"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setEntity(key)}
            className={[
              "rounded-md px-4 py-1.5 font-medium capitalize transition-colors",
              entity === key
                ? "bg-accent text-accent-fg shadow-sm"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50",
            ].join(" ")}
          >
            {key}
          </button>
        ))}
      </div>

      {!plans ? null : (
        <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-3">
          {plans.map((plan) => (
            <button
              key={plan.id}
              type="button"
              onClick={() => setPlanId(plan.id)}
              className={[
                "flex flex-col rounded-2xl border p-5 text-left transition-colors",
                planId === plan.id
                  ? "border-accent bg-accent/5"
                  : "border-zinc-200 hover:border-accent/40 dark:border-zinc-800",
              ].join(" ")}
            >
              <p className="font-semibold text-zinc-950 dark:text-zinc-50">
                {plan.name}
              </p>
              <p className="mt-1 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
                ${plan.price.toFixed(2)}
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                <Check size={14} className="shrink-0 text-accent" />
                {plan.benefit} ({durationLabel(plan.time_period)})
              </p>
            </button>
          ))}
        </div>
      )}

      {authLoading || meLoading ? null : !isAuthenticated ? (
        <div className="mx-auto mt-10 max-w-md rounded-2xl border border-zinc-200 p-8 text-center dark:border-zinc-800">
          <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
            Sign in to buy premium for one of your {entity}s.
          </p>
          <SignInLink>
            <Button variant="primary" size="sm">
              Sign in
            </Button>
          </SignInLink>
        </div>
      ) : (
        <div className="mx-auto mt-10 max-w-md">
          {eligibleCount === 0 ? (
            <p className="rounded-xl border border-zinc-200 px-4 py-3 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              None of your {entity}s are eligible right now a {entity} needs to
              be approved or certified, and not already premium.
            </p>
          ) : (
            <>
              <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 capitalize">
                {entity}
              </p>
              <div className="space-y-2">
                {entity === "bot"
                  ? eligibleBots.map((bot) => (
                      <button
                        key={bot.bot_id}
                        type="button"
                        onClick={() => setBotId(bot.bot_id)}
                        className={[
                          "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                          botId === bot.bot_id
                            ? "border-accent bg-accent/5"
                            : "border-zinc-200 hover:border-accent/40 dark:border-zinc-800",
                        ].join(" ")}
                      >
                        <Avatar
                          src={mirroredAvatarUrl(
                            "bots",
                            bot.bot_id,
                            bot.user.avatar,
                          )}
                          alt={bot.user.username}
                          size={28}
                        />
                        <span className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                          {bot.user.username}
                        </span>
                      </button>
                    ))
                  : eligibleServers.map((server) => (
                      <button
                        key={server.server_id}
                        type="button"
                        onClick={() => setServerId(server.server_id)}
                        className={[
                          "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                          serverId === server.server_id
                            ? "border-accent bg-accent/5"
                            : "border-zinc-200 hover:border-accent/40 dark:border-zinc-800",
                        ].join(" ")}
                      >
                        <Avatar
                          src={mirroredAvatarUrl(
                            "servers",
                            server.server_id,
                            server.avatar ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(server.name)}&size=64&background=random`,
                          )}
                          alt={server.name}
                          size={28}
                        />
                        <span className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                          {server.name}
                        </span>
                      </button>
                    ))}
              </div>

              {canRedeemBooster && (
                <div className="mt-5 flex items-start gap-3 rounded-xl border border-accent/20 bg-accent/5 p-4 text-sm text-zinc-700 dark:text-zinc-300">
                  <Gift size={16} className="mt-0.5 shrink-0 text-accent" />
                  <div className="flex-1">
                    <p>
                      You&apos;re a server booster redeem the Bronze plan free
                      instead of paying.
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={submitting === "redeem"}
                      disabled={!targetId}
                      onClick={handleRedeemBooster}
                      className="mt-3"
                    >
                      Redeem free
                    </Button>
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
                  {error}
                </div>
              )}

              <div className="mt-5 flex flex-col gap-2">
                {stripeAvailable && (
                  <Button
                    variant="primary"
                    size="lg"
                    loading={submitting === "stripe"}
                    disabled={!targetId || !planId || submitting !== null}
                    onClick={() => handleCheckout("stripe")}
                  >
                    Pay with Card
                  </Button>
                )}
                {paypalAvailable && (
                  <Button
                    variant={stripeAvailable ? "secondary" : "primary"}
                    size="lg"
                    loading={submitting === "paypal"}
                    disabled={!targetId || !planId || submitting !== null}
                    onClick={() => handleCheckout("paypal")}
                  >
                    Pay with PayPal
                  </Button>
                )}
                {!stripeAvailable && !paypalAvailable && (
                  <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
                    No payment methods are currently available. Please check
                    back later.
                  </p>
                )}
              </div>
            </>
          )}

          <p className="mt-6 text-center text-xs text-zinc-400 dark:text-zinc-600">
            Don&apos;t see the {entity} you want to upgrade?{" "}
            <Link href="/dashboard" className="underline underline-offset-2">
              Check your dashboard
            </Link>{" "}
            it needs to be approved or certified first.
          </p>
        </div>
      )}
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
