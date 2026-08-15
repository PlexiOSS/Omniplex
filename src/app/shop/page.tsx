"use client";

import { Award, Coins, Megaphone, ShoppingBag, Sparkles, Star, Zap } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { Container } from "@/components/layout/Container";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { SignInLink } from "@/components/ui/SignInLink";
import { useAuth } from "@/hooks/useAuth";
import { useMe } from "@/hooks/useMe";
import { shop, votes } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import type {
  EntityVoteRedeemLogSummary,
  ShopItem,
  ShopItemBenefit,
  ShopPurchase,
  TargetType,
  VoteCreditTierRedeemSummary,
} from "@/lib/api/types";
import { mirroredAvatarUrl } from "@/lib/utils/assets";
import { formatRelativeTime } from "@/lib/utils/format";

type Entity = Extract<TargetType, "bot" | "server">;

const BENEFIT_ICONS: Record<string, typeof Sparkles> = {
  premium_days: Star,
  priority_boost: Zap,
  featured_slot: Megaphone,
  supporter_badge: Award,
  vote_blitz: Sparkles,
};

function durationLabel(hours: number): string {
  if (hours <= 0) return "permanent";
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
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
  const [creditSummary, setCreditSummary] = useState<EntityVoteRedeemLogSummary | null>(null);
  const [voteSummary, setVoteSummary] = useState<VoteCreditTierRedeemSummary | null>(null);
  const [purchases, setPurchases] = useState<ShopPurchase[] | null>(null);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    shop.getItems().then((res) => setItems(res.items));
    shop.getBenefits().then((res) => setBenefits(res.items));
  }, []);

  const ownedBots = me?.user_bots ?? [];
  const ownedServers = (me?.user_teams ?? []).flatMap(
    (team) => team.entities?.servers ?? [],
  );

  useEffect(() => {
    if (!botId && ownedBots.length === 1) setBotId(ownedBots[0].bot_id);
    if (!serverId && ownedServers.length === 1) {
      setServerId(ownedServers[0].server_id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  const targetId = entity === "bot" ? botId : serverId;

  const refreshBalances = useCallback(() => {
    if (!targetId) return;
    votes.getRedeemLogs(entity, targetId).then(setCreditSummary).catch(() => setCreditSummary(null));
    votes.getCreditSummary(entity, targetId).then(setVoteSummary).catch(() => setVoteSummary(null));
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
      await votes.redeemCredits(entity, targetId, voteSummary.votes, session.token);
      setNotice("Votes converted to credits.");
      refreshBalances();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to redeem votes.");
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
      await shop.purchase(entity, targetId, item.id, session.token);
      setNotice(`Purchased ${item.name}.`);
      refreshBalances();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to purchase item.");
    } finally {
      setPurchasing(null);
    }
  }

  const availableCredits = creditSummary?.available_credits ?? 0;
  const ownedCount = entity === "bot" ? ownedBots.length : ownedServers.length;

  return (
    <Container className="py-16">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
          <ShoppingBag size={22} className="text-accent" />
        </div>
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          Shop
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Every vote a bot or server earns converts into credits. Spend them
          on priority placement, a featured homepage slot, bonus premium
          days, and more no card needed.
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

      {authLoading || meLoading ? null : !isAuthenticated ? (
        <div className="mx-auto mt-10 max-w-md rounded-2xl border border-zinc-200 p-8 text-center dark:border-zinc-800">
          <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
            Sign in to spend a {entity}&apos;s vote credits.
          </p>
          <SignInLink>
            <Button variant="primary" size="sm">
              Sign in
            </Button>
          </SignInLink>
        </div>
      ) : ownedCount === 0 ? (
        <p className="mt-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
          You don&apos;t have any {entity}s yet.
        </p>
      ) : (
        <div className="mx-auto mt-10 max-w-md">
          <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 capitalize">
            {entity}
          </p>
          <div className="space-y-2">
            {entity === "bot"
              ? ownedBots.map((bot) => (
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
                      src={mirroredAvatarUrl("bots", bot.bot_id, bot.user.avatar)}
                      alt={bot.user.username}
                      size={28}
                    />
                    <span className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                      {bot.user.username}
                    </span>
                  </button>
                ))
              : ownedServers.map((server) => (
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

          {targetId && (
            <div className="mt-5 flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-800">
              <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <Coins size={15} className="text-accent" />
                <span className="font-semibold text-zinc-950 dark:text-zinc-50">
                  {(availableCredits / 100).toFixed(2)}
                </span>
                credits available
              </div>
              {voteSummary && voteSummary.votes > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  loading={redeeming}
                  onClick={handleRedeem}
                >
                  Convert {voteSummary.votes} vote
                  {voteSummary.votes === 1 ? "" : "s"} ({(voteSummary.total_credits / 100).toFixed(2)})
                </Button>
              )}
            </div>
          )}

          {notice && (
            <p className="mt-3 text-center text-xs text-green-600 dark:text-green-400">
              {notice}
            </p>
          )}
          {error && (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
              {error}
            </div>
          )}
        </div>
      )}

      {items && items.length > 0 && (
        <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-2">
          {items
            .filter((item) => item.target_types.includes(entity))
            .map((item) => {
              const Icon = BENEFIT_ICONS[item.benefits[0] ?? ""] ?? ShoppingBag;
              const affordable = targetId && availableCredits >= Math.round(item.cents);
              return (
                <div
                  key={item.id}
                  className="flex flex-col rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800"
                >
                  <div className="flex items-center gap-2">
                    <Icon size={16} className="text-accent" />
                    <p className="font-semibold text-zinc-950 dark:text-zinc-50">
                      {item.name}
                    </p>
                  </div>
                  {item.description && (
                    <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                      {item.description}
                    </p>
                  )}
                  {item.benefits.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {item.benefits.map((b) => (
                        <span
                          key={b}
                          className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                        >
                          {benefitLabel(b)}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                      {(item.cents / 100).toFixed(2)} credits
                      {item.duration > 0 && ` · ${durationLabel(item.duration)}`}
                    </span>
                    <Button
                      variant="primary"
                      size="sm"
                      loading={purchasing === item.id}
                      disabled={!targetId || !affordable || purchasing !== null}
                      onClick={() => handlePurchase(item)}
                    >
                      {!targetId
                        ? `Pick a ${entity}`
                        : affordable
                          ? "Buy"
                          : "Not enough credits"}
                    </Button>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {targetId && purchases && purchases.length > 0 && (
        <div className="mx-auto mt-10 max-w-3xl">
          <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Purchase history
          </h2>
          <div className="mt-3 divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {purchases.map((purchase) => {
              const item = items?.find((i) => i.id === purchase.item_id);
              return (
                <div
                  key={purchase.id}
                  className="flex items-center justify-between px-4 py-3 text-sm"
                >
                  <span className="text-zinc-700 dark:text-zinc-300">
                    {item?.name ?? purchase.item_id}
                  </span>
                  <span className="flex items-center gap-3 text-xs text-zinc-400 dark:text-zinc-600">
                    <span>{(purchase.cents / 100).toFixed(2)} credits</span>
                    <span>{formatRelativeTime(purchase.created_at)}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="mt-6 text-center text-xs text-zinc-400 dark:text-zinc-600">
        Want to buy premium directly instead?{" "}
        <Link href="/premium" className="underline underline-offset-2">
          See plans
        </Link>
        .
      </p>
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
