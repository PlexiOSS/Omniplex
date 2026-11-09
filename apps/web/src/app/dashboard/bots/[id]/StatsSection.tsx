"use client";

import type { Bot } from "@omniplex/core/api/types";
import { formatCount, formatRelativeTime } from "@omniplex/core/utils/format";
import Link from "next/link";
import { AnalyticsPanel } from "../../manage/AnalyticsPanel";
import { StatGrid } from "../../manage/ManageShell";

export function StatsSection({ bot, token }: { bot: Bot; token: string }) {
  const uptime =
    bot.uptime_percent != null
      ? `${Math.round(bot.uptime_percent * 10) / 10}%`
      : "No data yet";
  return (
    <div className="space-y-6">
      <StatGrid
        stats={[
          { label: "Votes this month", value: formatCount(bot.votes) },
          {
            label: "Automatic votes",
            value: formatCount(bot.auto_votes ?? 0),
          },
          { label: "Servers", value: formatCount(bot.servers) },
          { label: "Shards", value: formatCount(bot.shards) },
          { label: "Views (30 days)", value: formatCount(bot.views_30d ?? 0) },
          { label: "All-time views", value: formatCount(bot.clicks) },
          { label: "Invite clicks", value: formatCount(bot.invite_clicks) },
          { label: "Uptime (30 days)", value: uptime },
          {
            label: "Last uptime check",
            value: bot.uptime_last_checked
              ? formatRelativeTime(bot.uptime_last_checked)
              : "Never",
          },
        ]}
      />
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Server and shard counts come from your bot posting its stats. See{" "}
        <Link
          href="/kb/developers/posting-stats"
          className="text-accent hover:underline"
        >
          Posting Stats
        </Link>{" "}
        and{" "}
        <Link
          href="/kb/developers/status-and-uptime"
          className="text-accent hover:underline"
        >
          Bot Status &amp; Uptime
        </Link>
        .
      </p>
      <AnalyticsPanel kind="bot" id={bot.bot_id} token={token} />
    </div>
  );
}
