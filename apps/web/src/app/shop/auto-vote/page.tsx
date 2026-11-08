"use client";

import { payments, users } from "@omniplex/core/api";
import type { AutoVotePricing, AutoVoteStatus } from "@omniplex/core/api/types";
import { Button } from "@omniplex/ui/Button";
import { CalendarClock, Gem, Layers, Repeat } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AutoVoteSubscribe } from "@/components/billing/AutoVoteSubscribe";
import { formatCents } from "@/components/billing/PromoCodeField";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingState } from "@/components/ui/PageStates";
import { useAuth } from "@/hooks/useAuth";

function AutoVoteShopInner() {
  const searchParams = useSearchParams();
  const { session, loading: authLoading } = useAuth();
  const [pricing, setPricing] = useState<AutoVotePricing | null>(null);
  const [status, setStatus] = useState<AutoVoteStatus | null>(null);
  const [statusLoaded, setStatusLoaded] = useState(false);

  useEffect(() => {
    payments
      .getPlans()
      .then((res) => setPricing(res.auto_vote ?? null))
      .catch(() => setPricing(null));
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      setStatusLoaded(true);
      return;
    }
    users
      .getAutoVote(session.user_id, session.token)
      .then(setStatus)
      .catch(() => setStatus(null))
      .finally(() => setStatusLoaded(true));
  }, [session, authLoading]);

  const features = pricing
    ? [
        {
          icon: CalendarClock,
          title: "Your schedule",
          body: "Vote all the time, or only on the days and hours you pick for each listing.",
        },
        {
          icon: Layers,
          title: `${pricing.included_slots} listings, then more`,
          body: `Add up to ${pricing.max_extra_slots} extra slots for ${formatCents(pricing.slot_price_cents)} a month each (${formatCents(pricing.yearly_slot_price_cents)} a year on the yearly plan).`,
        },
        {
          icon: Gem,
          title: "A free slot for boosters",
          body: "Boost the Omniplex Discord server and get one extra slot while you boost.",
        },
      ]
    : [];

  return (
    <Container className="py-10">
      <PageHeader
        centered
        icon={Repeat}
        title="Auto-vote"
        description="Keep voting for the bots and servers you love without coming back every few hours."
      />

      {!pricing || !statusLoaded ? (
        <LoadingState label="Loading Auto-vote…" />
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          {status?.subscribed ? (
            <section className="flex flex-wrap items-center gap-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 sm:p-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-400">
                <Repeat size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-zinc-950 dark:text-zinc-50">
                  You&apos;re subscribed
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  {status.targets.length} of {status.max_targets} listings set
                  up. Change listings, schedules and slots from your dashboard.
                </p>
              </div>
              <Link href="/dashboard?tab=auto-vote">
                <Button variant="secondary" size="sm">
                  Manage Auto-vote
                </Button>
              </Link>
            </section>
          ) : (
            <AutoVoteSubscribe
              priceCents={pricing.price_cents}
              yearlyPriceCents={pricing.yearly_price_cents}
              includedSlots={pricing.included_slots}
              slotPriceCents={pricing.slot_price_cents}
              userId={session?.user_id}
              token={session?.token}
              initialPromo={searchParams.get("promo")}
            />
          )}

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {features.map(({ icon: Icon, title, body }) => (
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
        </div>
      )}
    </Container>
  );
}

export default function AutoVoteShopPage() {
  return (
    <Suspense>
      <AutoVoteShopInner />
    </Suspense>
  );
}
