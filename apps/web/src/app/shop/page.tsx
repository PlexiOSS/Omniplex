"use client";

import {
  ArrowRight,
  Award,
  Check,
  Coins,
  Flashlight,
  Highlighter,
  Megaphone,
  Package,
  Palette,
  ShoppingBag,
  Sparkles,
  Star,
  Ticket,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import {
  botOption,
  EntityToggle,
  ListingPicker,
  serverOption,
} from "@/components/billing/ListingPicker";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Pagination } from "@/components/search/Pagination";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SignInLink } from "@/components/ui/SignInLink";
import { useAuth } from "@/hooks/useAuth";
import { useMe } from "@/hooks/useMe";
import { shop, votes } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import type {
  EntityVote,
  EntityVoteRedeemLogSummary,
  PagedResult,
  ShopCoupon,
  ShopItem,
  ShopItemBenefit,
  ShopPurchase,
  TargetType,
  VoteCreditTier,
  VoteCreditTierRedeemSummary,
} from "@/lib/api/types";
import { formatCountLabel, formatRelativeTime } from "@/lib/utils/format";

type Entity = Extract<TargetType, "bot" | "server">;
type HistoryTab = "purchases" | "votes";

const BENEFIT_ICONS: Record<string, typeof Sparkles> = {
  premium_days: Star,
  priority_boost: Zap,
  featured_slot: Megaphone,
  supporter_badge: Award,
  vote_blitz: Sparkles,
  highlight: Highlighter,
  spotlight_slot: Flashlight,
  card_theme: Palette,
};

type VoteHistoryEntry =
  | { kind: "vote"; vote: EntityVote }
  | { kind: "voided"; reason: string; voidedAt: string | null; count: number };

function groupVoteHistory(votes: EntityVote[]): VoteHistoryEntry[] {
  const groups: VoteHistoryEntry[] = [];

  for (const vote of votes) {
    // A vote redeemed for credits is no longer marked void (it still counts
    // toward the entity's public vote total -- see popplio's votes.sql), but
    // it should still show up here as its own grouped entry rather than a
    // plain "Vote #N" row, same as a genuinely voided vote does.
    if (!vote.void && !vote.credit_redeem) {
      groups.push({ kind: "vote", vote });
      continue;
    }

    const reason = vote.credit_redeem
      ? "Vote credits redeemed"
      : (vote.void_reason ?? "Voided");
    const last = groups[groups.length - 1];

    if (
      last?.kind === "voided" &&
      last.reason === reason &&
      last.voidedAt === vote.voided_at
    ) {
      last.count += 1;
      continue;
    }

    groups.push({ kind: "voided", reason, voidedAt: vote.voided_at, count: 1 });
  }

  return groups;
}

function durationLabel(hours: number): string {
  if (hours <= 0) return "Permanent";
  if (hours < 24) return `${hours} hours`;
  const days = Math.round(hours / 24);
  return `${days} ${days === 1 ? "day" : "days"}`;
}

function credits(cents: number): string {
  return (cents / 100).toFixed(2);
}

function ShopPageInner() {
  const searchParams = useSearchParams();
  const { session, isAuthenticated, loading: authLoading } = useAuth();
  const { me, loading: meLoading } = useMe(session);

  const [items, setItems] = useState<ShopItem[] | null>(null);
  const [benefits, setBenefits] = useState<ShopItemBenefit[]>([]);
  const [entity, setEntity] = useState<Entity>(
    searchParams.get("server") ? "server" : "bot",
  );
  const [botId, setBotId] = useState(searchParams.get("bot") ?? "");
  const [serverId, setServerId] = useState(searchParams.get("server") ?? "");
  const [creditSummary, setCreditSummary] =
    useState<EntityVoteRedeemLogSummary | null>(null);
  const [voteSummary, setVoteSummary] =
    useState<VoteCreditTierRedeemSummary | null>(null);
  const [purchases, setPurchases] = useState<ShopPurchase[] | null>(null);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [publicCoupons, setPublicCoupons] = useState<ShopCoupon[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [tiers, setTiers] = useState<VoteCreditTier[] | null>(null);
  const [voteHistory, setVoteHistory] = useState<PagedResult<
    EntityVote[]
  > | null>(null);
  const [voteHistoryPage, setVoteHistoryPage] = useState(1);
  const [historyTab, setHistoryTab] = useState<HistoryTab>("purchases");

  useEffect(() => {
    shop.getItems().then((res) => setItems(res.items));
    shop.getBenefits().then((res) => setBenefits(res.items));
    shop
      .getPublicCoupons()
      .then((res) => setPublicCoupons(res.items))
      .catch(() => setPublicCoupons([]));
  }, []);

  useEffect(() => {
    votes
      .getGeneralCreditTiers(entity)
      .then(setTiers)
      .catch(() => setTiers(null));
  }, [entity]);

  const botOptions = (me?.user_bots ?? []).map((b) => botOption(b));
  const seenServers = new Set<string>();
  const serverOptions = (me?.user_teams ?? [])
    .flatMap((team) => team.entities?.servers ?? [])
    .filter((s) => {
      if (seenServers.has(s.server_id)) return false;
      seenServers.add(s.server_id);
      return true;
    })
    .map((s) => serverOption(s));
  const options = entity === "bot" ? botOptions : serverOptions;
  const firstBotId = botOptions[0]?.id ?? "";
  const firstServerId = serverOptions[0]?.id ?? "";

  useEffect(() => {
    if (firstBotId) setBotId((current) => current || firstBotId);
    if (firstServerId) setServerId((current) => current || firstServerId);
  }, [firstBotId, firstServerId]);

  const targetId = entity === "bot" ? botId : serverId;

  // biome-ignore lint/correctness/useExhaustiveDependencies: entity/targetId are triggers, not read in the body
  useEffect(() => {
    setVoteHistoryPage(1);
    setNotice(null);
    setError(null);
  }, [entity, targetId]);

  useEffect(() => {
    if (!session || !targetId) {
      setVoteHistory(null);
      return;
    }
    votes
      .getUserVotes(session.user_id, entity, targetId, voteHistoryPage)
      .then(setVoteHistory)
      .catch(() => setVoteHistory(null));
  }, [session, entity, targetId, voteHistoryPage]);

  const refreshBalances = useCallback(() => {
    if (!targetId) return;
    votes
      .getRedeemLogs(entity, targetId)
      .then(setCreditSummary)
      .catch(() => setCreditSummary(null));
    votes
      .getCreditSummary(entity, targetId)
      .then(setVoteSummary)
      .catch(() => setVoteSummary(null));
    shop
      .getPurchases(entity, targetId)
      .then((res) => setPurchases(res.items))
      .catch(() => setPurchases(null));
  }, [entity, targetId]);

  useEffect(() => {
    refreshBalances();
  }, [refreshBalances]);

  function benefitLabel(id: string): string {
    return benefits.find((b) => b.id === id)?.name ?? id;
  }

  async function handleRedeem() {
    if (!session || !targetId || !voteSummary || voteSummary.votes <= 0) return;
    setRedeeming(true);
    setError(null);
    try {
      await votes.redeemCredits(
        entity,
        targetId,
        voteSummary.votes,
        session.token,
      );
      setNotice("Votes converted to credits.");
      refreshBalances();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to redeem votes.",
      );
    } finally {
      setRedeeming(false);
    }
  }

  async function handlePurchase(item: ShopItem) {
    if (!session || !targetId) return;
    setPurchasing(item.id);
    setError(null);
    setNotice(null);
    try {
      await shop.purchase(
        entity,
        targetId,
        item.id,
        session.token,
        couponCode.trim(),
      );
      setNotice(
        couponCode.trim()
          ? `Purchased ${item.name} with your coupon.`
          : `Purchased ${item.name}.`,
      );
      refreshBalances();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to purchase item.",
      );
    } finally {
      setPurchasing(null);
    }
  }

  const availableCredits = creditSummary?.available_credits ?? 0;
  const applicableCoupons = publicCoupons.filter(
    (coupon) =>
      coupon.target_types.length === 0 || coupon.target_types.includes(entity),
  );
  const visibleItems = (items ?? [])
    .filter((item) => item.target_types.includes(entity))
    .sort(
      (a, b) => Number(a.benefits.length > 1) - Number(b.benefits.length > 1),
    );
  const hasCoupon = couponCode.trim().length > 0;
  const signedIn = !authLoading && isAuthenticated;
  const hasListing = signedIn && !meLoading && options.length > 0;

  return (
    <Container className="py-10">
      <PageHeader
        centered
        icon={ShoppingBag}
        title="Shop"
        description={
          <>
            The votes your bot or server earns convert into credits. Spend them
            on boosts, a featured homepage slot, bonus premium days and more,
            with no card needed.
          </>
        }
      />

      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-10">
          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                Items
              </h2>
              <EntityToggle value={entity} onChange={setEntity} />
            </div>
            {!items ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-36 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800"
                  />
                ))}
              </div>
            ) : visibleItems.length === 0 ? (
              <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                Nothing for {entity}s in the shop right now.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {visibleItems.map((item) => {
                  const Icon =
                    item.benefits.length > 1
                      ? Package
                      : (BENEFIT_ICONS[item.benefits[0] ?? ""] ?? ShoppingBag);
                  const affordable =
                    hasCoupon || availableCredits >= Math.round(item.cents);
                  const extraBenefits =
                    item.benefits.length > 1
                      ? item.benefits.map(benefitLabel)
                      : [];
                  return (
                    <div
                      key={item.id}
                      className={[
                        "flex min-w-0 flex-col rounded-xl border bg-white p-4 dark:bg-zinc-900",
                        extraBenefits.length > 0
                          ? "border-accent/30 sm:col-span-2 dark:border-accent/30"
                          : "border-zinc-200 dark:border-zinc-800",
                      ].join(" ")}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                          <Icon size={16} className="text-accent" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-zinc-950 dark:text-zinc-50">
                            {item.name}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {durationLabel(item.duration)}
                          </p>
                        </div>
                      </div>
                      {item.description && (
                        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                          {item.description}
                        </p>
                      )}
                      {extraBenefits.length > 0 && (
                        <ul className="mt-3 grid gap-x-4 gap-y-1.5 text-sm text-zinc-600 sm:grid-cols-2 dark:text-zinc-300">
                          {extraBenefits.map((label) => (
                            <li key={label} className="flex items-start gap-2">
                              <Check
                                size={14}
                                className="mt-0.5 shrink-0 text-accent"
                              />
                              {label}
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                        <span className="flex items-center gap-1.5 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                          <Coins size={14} className="text-accent" />
                          {credits(item.cents)}
                        </span>
                        {hasListing && (
                          <Button
                            variant={affordable ? "primary" : "secondary"}
                            size="sm"
                            loading={purchasing === item.id}
                            disabled={
                              !targetId || !affordable || purchasing !== null
                            }
                            onClick={() => handlePurchase(item)}
                          >
                            {affordable
                              ? "Buy"
                              : `Need ${credits(Math.round(item.cents) - availableCredits)} more`}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {hasListing && targetId && (
            <section>
              <div className="mb-3 flex items-center gap-1 border-b border-zinc-200 dark:border-zinc-800">
                {(
                  [
                    ["purchases", "Purchases"],
                    ["votes", "Your votes"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setHistoryTab(key)}
                    className={[
                      "-mb-px border-b-2 px-3 pb-2.5 text-sm font-medium transition-colors",
                      historyTab === key
                        ? "border-accent text-accent"
                        : "border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50",
                    ].join(" ")}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {historyTab === "purchases" &&
                (!purchases || purchases.length === 0 ? (
                  <p className="py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    Nothing bought for this {entity} yet.
                  </p>
                ) : (
                  <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
                    {purchases.map((purchase) => {
                      const item = items?.find(
                        (i) => i.id === purchase.item_id,
                      );
                      return (
                        <div
                          key={purchase.id}
                          className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                        >
                          <span className="min-w-0 truncate text-zinc-700 dark:text-zinc-300">
                            {item?.name ?? purchase.item_id}
                          </span>
                          <span className="flex shrink-0 items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                            <span>{credits(purchase.cents)} credits</span>
                            <span>
                              {formatRelativeTime(purchase.created_at)}
                            </span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ))}

              {historyTab === "votes" &&
                (!voteHistory || voteHistory.results.length === 0 ? (
                  <p className="py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    You haven&apos;t voted for this {entity}
                    {voteHistoryPage > 1 ? " on this page" : " yet"}.
                  </p>
                ) : (
                  <>
                    <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
                      {groupVoteHistory(voteHistory.results).map((entry, i) =>
                        entry.kind === "vote" ? (
                          <div
                            key={entry.vote.itag}
                            className="flex items-center justify-between px-4 py-3 text-sm"
                          >
                            <span className="text-zinc-700 dark:text-zinc-300">
                              Vote #{entry.vote.vote_num}
                            </span>
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                              {formatRelativeTime(entry.vote.created_at)}
                            </span>
                          </div>
                        ) : (
                          <div
                            // biome-ignore lint/suspicious/noArrayIndexKey: entries have no stable id, order is stable within a page
                            key={`voided-${i}`}
                            className="flex items-center justify-between px-4 py-3 text-sm"
                          >
                            <span
                              className={
                                entry.reason === "Vote credits redeemed"
                                  ? "text-xs text-emerald-600 dark:text-emerald-400"
                                  : "text-xs text-zinc-500 dark:text-zinc-400"
                              }
                            >
                              {formatCountLabel(entry.count, "vote")}{" "}
                              {entry.reason === "Vote credits redeemed"
                                ? "redeemed for credits"
                                : `cleared: ${entry.reason.toLowerCase()}`}
                            </span>
                            {entry.voidedAt && (
                              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                {formatRelativeTime(entry.voidedAt)}
                              </span>
                            )}
                          </div>
                        ),
                      )}
                    </div>
                    {voteHistory.count > voteHistory.per_page && (
                      <div className="mt-4">
                        <Pagination
                          page={voteHistoryPage}
                          total={voteHistory.count}
                          perPage={voteHistory.per_page}
                          onPageChange={setVoteHistoryPage}
                        />
                      </div>
                    )}
                  </>
                ))}
            </section>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="space-y-4 p-5">
              <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                Wallet
              </h2>
              {authLoading || meLoading ? (
                <div className="h-12 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
              ) : !isAuthenticated ? (
                <div className="text-center">
                  <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
                    Sign in to spend a {entity}&apos;s credits.
                  </p>
                  <SignInLink>
                    <Button variant="primary" size="sm">
                      Sign in
                    </Button>
                  </SignInLink>
                </div>
              ) : options.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  You don&apos;t have any {entity}s yet.{" "}
                  <Link
                    href={entity === "bot" ? "/bots/add" : "/servers/add"}
                    className="text-accent hover:underline"
                  >
                    Add one
                  </Link>
                </p>
              ) : (
                <>
                  <ListingPicker
                    entity={entity}
                    options={options}
                    value={targetId}
                    onChange={entity === "bot" ? setBotId : setServerId}
                  />
                  {targetId && (
                    <div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Available credits
                      </p>
                      <p className="mt-0.5 flex items-center gap-2 text-2xl font-semibold tabular-nums text-zinc-950 dark:text-zinc-50">
                        <Coins size={18} className="text-accent" />
                        {credits(availableCredits)}
                      </p>
                      {voteSummary && voteSummary.votes > 0 ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          loading={redeeming}
                          onClick={handleRedeem}
                          className="mt-3 w-full"
                        >
                          Convert {formatCountLabel(voteSummary.votes, "vote")}{" "}
                          into {credits(voteSummary.total_credits)}
                        </Button>
                      ) : (
                        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                          No unconverted votes right now.
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}

              {notice && (
                <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                  {notice}
                </p>
              )}
              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-400">
                  {error}
                </p>
              )}
            </div>

            {hasListing && targetId && (
              <div className="space-y-2 border-t border-zinc-100 bg-zinc-50/60 p-5 dark:border-zinc-800 dark:bg-zinc-950/40">
                <p className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  <Ticket size={12} />
                  Coupon
                </p>
                <Input
                  placeholder="Enter a code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="text-sm"
                />
                {applicableCoupons.map((coupon) => (
                  <button
                    key={coupon.id}
                    type="button"
                    onClick={() => setCouponCode(coupon.code)}
                    className="flex w-full items-center justify-between gap-2 rounded-lg border border-dashed border-accent/30 bg-accent/5 px-3 py-2 text-left text-xs transition-colors hover:border-accent/60"
                  >
                    <span className="font-mono font-medium text-zinc-950 dark:text-zinc-50">
                      {coupon.code}
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-400">
                      {coupon.cents == null
                        ? "Makes an item free"
                        : `Any item for ${credits(coupon.cents)}`}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {tiers && tiers.length > 0 && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                How votes become credits
              </h2>
              <dl className="mt-3 space-y-1.5 text-sm">
                {tiers.map((tier) => (
                  <div key={tier.id} className="flex justify-between gap-2">
                    <dt className="text-zinc-500 dark:text-zinc-400">
                      {formatCountLabel(tier.votes, "vote")}
                    </dt>
                    <dd className="tabular-nums text-zinc-950 dark:text-zinc-50">
                      {credits(tier.cents)} credits
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <div className="space-y-2 text-xs text-zinc-500 dark:text-zinc-400">
            <Link
              href={`/premium${targetId ? `?${entity}=${targetId}` : ""}`}
              className="group flex items-center justify-between rounded-lg px-1 py-1 transition-colors hover:text-accent"
            >
              Buy premium with a card instead
              <ArrowRight
                size={12}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>
            <Link
              href="/kb/premium/shop"
              className="group flex items-center justify-between rounded-lg px-1 py-1 transition-colors hover:text-accent"
            >
              How credits and the shop work
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

export default function ShopPage() {
  return (
    <Suspense>
      <ShopPageInner />
    </Suspense>
  );
}
