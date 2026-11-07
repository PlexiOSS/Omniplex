"use client";

import { reviews, votes, webhooks } from "@omniplex/core/api";
import type { Team } from "@omniplex/core/api/types";
import { hasPermString } from "@omniplex/core/permissions";
import { mirroredAvatarUrl } from "@omniplex/core/utils/assets";
import { formatCount, formatCountLabel } from "@omniplex/core/utils/format";
import { Avatar } from "@omniplex/ui/Avatar";
import { ArrowUpRight, Bot, Server } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SettingsCard, StatGrid } from "@/app/dashboard/manage/ManageShell";

export function OverviewSection({
  team,
  ownPerms,
  token,
}: {
  team: Team;
  ownPerms: string[];
  token: string;
}) {
  const [reviewStats, setReviewStats] = useState<{
    count: number;
    avgStars: number;
  } | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [webhookStats, setWebhookStats] = useState<{
    configured: number;
    deliveries: number;
  } | null>(null);

  const canViewWebhookActivity =
    hasPermString(ownPerms, "manage_webhooks") ||
    hasPermString(ownPerms, "view_webhook_logs");

  useEffect(() => {
    reviews
      .getAll("team", team.id)
      .then((res) => {
        const stars = res.reviews.map((r) => r.stars);
        setReviewStats({
          count: stars.length,
          avgStars:
            stars.length > 0
              ? stars.reduce((a, b) => a + b, 0) / stars.length
              : 0,
        });
      })
      .catch(() => setReviewStats({ count: 0, avgStars: 0 }));

    votes
      .getRedeemLogs("team", team.id)
      .then((res) => setCredits(res.available_credits))
      .catch(() => setCredits(null));
  }, [team.id]);

  useEffect(() => {
    if (!canViewWebhookActivity) return;
    Promise.all([
      webhooks.list("team", team.id, token),
      webhooks.getLogs("team", team.id, 1, token),
    ])
      .then(([list, logs]) => {
        setWebhookStats({ configured: list.length, deliveries: logs.count });
      })
      .catch(() => setWebhookStats(null));
  }, [canViewWebhookActivity, team.id, token]);

  const members = team.entities?.members ?? [];
  const bots = team.entities?.bots ?? [];
  const servers = team.entities?.servers ?? [];
  const canEditBots = hasPermString(ownPerms, "edit_bots");
  const canEditServers = hasPermString(ownPerms, "edit_servers");

  const listings = [
    ...bots.map((b) => ({
      key: `bot-${b.bot_id}`,
      kind: "Bot" as const,
      name: b.user.username,
      avatar: mirroredAvatarUrl("bots", b.bot_id, b.user.avatar),
      viewHref: `/bots/${b.vanity || b.bot_id}`,
      manageHref: canEditBots ? `/dashboard/bots/${b.bot_id}` : null,
    })),
    ...servers.map((s) => ({
      key: `server-${s.server_id}`,
      kind: "Server" as const,
      name: s.name,
      avatar: mirroredAvatarUrl("servers", s.server_id, s.avatar),
      viewHref: `/servers/${s.vanity || s.server_id}`,
      manageHref: canEditServers ? `/dashboard/servers/${s.server_id}` : null,
    })),
  ];

  return (
    <div className="space-y-6">
      <StatGrid
        stats={[
          { label: "Votes", value: formatCount(team.votes) },
          { label: "Members", value: formatCount(members.length) },
          { label: "Bots", value: formatCount(bots.length) },
          { label: "Servers", value: formatCount(servers.length) },
          {
            label: "Reviews",
            value: reviewStats
              ? reviewStats.count > 0
                ? `${reviewStats.count} (${reviewStats.avgStars.toFixed(1)}★)`
                : "0"
              : "…",
          },
          {
            label: "Vote credits",
            value: credits !== null ? (credits / 100).toFixed(2) : "…",
          },
        ]}
      />

      <SettingsCard
        title="Listings"
        description="Bots and servers this team owns."
      >
        {listings.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            This team doesn&apos;t own any listings yet.
          </p>
        ) : (
          <ul className="-my-2 divide-y divide-zinc-100 dark:divide-zinc-800">
            {listings.map((l) => (
              <li key={l.key} className="flex items-center gap-3 py-2.5">
                <Avatar src={l.avatar} alt={l.name} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                    {l.name}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {l.kind === "Bot" ? (
                      <Bot size={11} />
                    ) : (
                      <Server size={11} />
                    )}
                    {l.kind}
                  </p>
                </div>
                <Link
                  href={l.viewHref}
                  className="inline-flex items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                >
                  View <ArrowUpRight size={11} />
                </Link>
                {l.manageHref && (
                  <Link
                    href={l.manageHref}
                    className="text-xs font-medium text-accent hover:underline"
                  >
                    Manage
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </SettingsCard>

      {canViewWebhookActivity && (
        <SettingsCard
          title="Webhook activity"
          description={
            webhookStats
              ? `${formatCountLabel(webhookStats.configured, "webhook")} configured, ${formatCountLabel(webhookStats.deliveries, "delivery", "deliveries")} logged.`
              : "Loading…"
          }
        />
      )}
    </div>
  );
}
