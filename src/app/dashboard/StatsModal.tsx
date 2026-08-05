"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { bots, servers } from "@/lib/api";
import type { Bot, Server } from "@/lib/api/types";
import { formatCount, formatRelativeTime } from "@/lib/utils/format";

function StatRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-100 py-2.5 text-sm last:border-b-0 dark:border-zinc-800/60">
      <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className="font-medium text-zinc-950 dark:text-zinc-50">
        {value}
      </span>
    </div>
  );
}

function LoadingOrError({
  loading,
  error,
}: {
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return (
      <p className="py-8 text-sm text-center text-zinc-500 dark:text-zinc-400">
        Loading…
      </p>
    );
  }
  return (
    <p className="py-8 text-sm text-center text-red-600 dark:text-red-400">
      {error}
    </p>
  );
}

interface BotStatsModalProps {
  botId: string;
  onClose: () => void;
}

export function BotStatsModal({ botId, onClose }: BotStatsModalProps) {
  const [bot, setBot] = useState<Bot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    bots
      .getBot(botId)
      .then((b) => {
        if (!cancelled) setBot(b);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load bot statistics.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [botId]);

  const uptimePct =
    bot && bot.total_uptime > 0
      ? Math.round((bot.uptime / bot.total_uptime) * 100)
      : null;

  return (
    <Modal open onClose={onClose} title="Bot Statistics">
      {loading || error || !bot ? (
        <LoadingOrError loading={loading} error={error ?? "Bot not found."} />
      ) : (
        <div>
          <StatRow label="Votes" value={formatCount(bot.votes)} />
          <StatRow
            label="Servers"
            value={formatCount(bot.servers)}
          />
          <StatRow label="Shards" value={bot.shards} />
          <StatRow label="Page Views" value={formatCount(bot.clicks)} />
          <StatRow
            label="Unique Page Views"
            value={formatCount(bot.unique_clicks)}
          />
          <StatRow
            label="Invite Clicks"
            value={formatCount(bot.invite_clicks)}
          />
          <StatRow
            label="Uptime"
            value={
              uptimePct === null
                ? "Not checked yet"
                : `${uptimePct}% (${formatCount(bot.uptime)}/${formatCount(bot.total_uptime)} checks)`
            }
          />
          <StatRow
            label="Last Checked"
            value={
              bot.uptime_last_checked
                ? formatRelativeTime(bot.uptime_last_checked)
                : "Never"
            }
          />
        </div>
      )}
    </Modal>
  );
}

interface ServerStatsModalProps {
  serverId: string;
  onClose: () => void;
}

export function ServerStatsModal({ serverId, onClose }: ServerStatsModalProps) {
  const [server, setServer] = useState<Server | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    servers
      .getServer(serverId)
      .then((s) => {
        if (!cancelled) setServer(s);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load server statistics.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [serverId]);

  return (
    <Modal open onClose={onClose} title="Server Statistics">
      {loading || error || !server ? (
        <LoadingOrError
          loading={loading}
          error={error ?? "Server not found."}
        />
      ) : (
        <div>
          <StatRow
            label="Members"
            value={formatCount(server.total_members)}
          />
          <StatRow
            label="Online Members"
            value={formatCount(server.online_members)}
          />
          <StatRow label="Votes" value={formatCount(server.votes)} />
          <StatRow label="Page Views" value={formatCount(server.clicks)} />
          <StatRow
            label="Unique Page Views"
            value={formatCount(server.unique_clicks)}
          />
          <StatRow
            label="Invite Clicks"
            value={formatCount(server.invite_clicks)}
          />
        </div>
      )}
    </Modal>
  );
}
