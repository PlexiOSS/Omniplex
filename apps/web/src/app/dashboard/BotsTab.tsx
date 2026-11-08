"use client";

import type { BotType, IndexBot, Team } from "@omniplex/core/api/types";
import { hasAnyPermString, hasPermString } from "@omniplex/core/permissions";
import { mirroredAvatarUrl } from "@omniplex/core/utils/assets";
import { formatCount, formatCountLabel } from "@omniplex/core/utils/format";
import { Avatar } from "@omniplex/ui/Avatar";
import { Badge } from "@omniplex/ui/Badge";
import { Button } from "@omniplex/ui/Button";
import { Dropdown, DropdownItem } from "@omniplex/ui/Dropdown";
import {
  ArrowUpRight,
  BarChart2,
  Bot,
  KeyRound,
  Megaphone,
  MoreHorizontal,
  Settings,
  ShoppingBag,
  Sparkles,
  Terminal,
  Trash2,
  Users,
  Webhook as WebhookIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ListingFilters,
  type ListingSort,
  matchesStatus,
  type OwnershipFilter,
  type StatusFilter,
} from "./ListingFilters";

const BOT_STATUS: Record<
  BotType,
  {
    label: string;
    variant: "default" | "success" | "warning" | "danger";
  } | null
> = {
  approved: null,
  certified: null,
  pending: { label: "Pending", variant: "warning" },
  under_review: { label: "Under Review", variant: "warning" },
  claimed: { label: "In Review", variant: "warning" },
  denied: { label: "Denied", variant: "danger" },
  banned: { label: "Banned", variant: "danger" },
};

function BotItem({
  bot,
  team,
  canManage = true,
  myFlags = ["owner"],
}: {
  bot: IndexBot;
  /** Set when this bot is owned by a team the user is a member of, rather than owned directly. */
  team?: Team;
  /** Whether the current user has permission to edit this bot. Always true for directly-owned bots. */
  canManage?: boolean;
  /** The current user's resolved flags on this bot's team — defaults to owner for directly-owned bots. */
  myFlags?: string[];
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const manageHref = `/dashboard/bots/${bot.bot_id}`;
  const canSeeTokens = hasAnyPermString(myFlags, [
    "view_sessions",
    "manage_sessions",
  ]);
  const canSeeWebhooks = hasAnyPermString(myFlags, [
    "view_webhooks",
    "manage_webhooks",
  ]);
  const canDelete = hasPermString(myFlags, "delete_bots");

  const status = BOT_STATUS[bot.type];

  function go(href: string) {
    setMenuOpen(false);
    router.push(href);
  }

  return (
    <div className="flex min-w-0 flex-col rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start gap-3">
        <Avatar
          src={mirroredAvatarUrl("bots", bot.bot_id, bot.user.avatar)}
          alt={bot.user.username}
          size={44}
        />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold truncate text-zinc-950 dark:text-zinc-50">
              {bot.user.username}
            </span>
            {bot.premium && <Badge variant="premium">Premium</Badge>}
            {bot.type === "certified" && (
              <Badge variant="success">Certified</Badge>
            )}
            {status && <Badge variant={status.variant}>{status.label}</Badge>}
          </div>
          <p className="mt-0.5 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
            {bot.short}
          </p>
          {team && (
            <div className="mt-1.5 flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-600">
              <Users size={11} />
              via {team.name}
              {!canManage && " · view only"}
            </div>
          )}
        </div>
      </div>

      {bot.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {bot.tags.slice(0, 4).map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
      )}

      <div className="min-h-4 flex-1" />
      <div className="-mx-4 -mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-b-[calc(var(--radius-2xl)-1px)] border-t border-zinc-100 bg-zinc-50/60 px-4 py-2.5 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-400">
        <span className="whitespace-nowrap">
          {formatCountLabel(bot.approximate_votes, "vote")}
        </span>
        <div className="flex items-center gap-2">
          <Link
            href={`/bots/${bot.vanity || bot.bot_id}`}
            className="inline-flex items-center gap-1 text-xs transition-colors text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            View
            <ArrowUpRight size={11} />
          </Link>
          {canManage && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(manageHref)}
              className="px-2 text-xs h-7"
            >
              <Settings size={12} />
              Manage
            </Button>
          )}
          <Dropdown
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            trigger={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMenuOpen((o) => !o)}
                className="px-1.5 text-xs h-7"
                aria-label="More actions"
              >
                <MoreHorizontal size={14} />
              </Button>
            }
          >
            {!bot.premium &&
              (bot.type === "approved" || bot.type === "certified") && (
                <DropdownItem
                  icon={<Sparkles size={14} />}
                  onClick={() => go(`/shop/premium?bot=${bot.bot_id}`)}
                >
                  Upgrade
                </DropdownItem>
              )}
            <DropdownItem
              icon={<ShoppingBag size={14} />}
              onClick={() => go(`/shop/items?bot=${bot.bot_id}`)}
            >
              Shop
            </DropdownItem>
            {canManage && (
              <>
                <DropdownItem
                  icon={<BarChart2 size={14} />}
                  onClick={() => go(`${manageHref}?section=stats`)}
                >
                  Statistics
                </DropdownItem>
                <DropdownItem
                  icon={<Terminal size={14} />}
                  onClick={() => go(`${manageHref}?section=commands`)}
                >
                  Commands
                </DropdownItem>
                <DropdownItem
                  icon={<Megaphone size={14} />}
                  onClick={() => go(`${manageHref}?section=changelog`)}
                >
                  Changelog
                </DropdownItem>
                {canSeeTokens && (
                  <DropdownItem
                    icon={<KeyRound size={14} />}
                    onClick={() => go(`${manageHref}?section=sessions`)}
                  >
                    API sessions
                  </DropdownItem>
                )}
                {canSeeWebhooks && (
                  <DropdownItem
                    icon={<WebhookIcon size={14} />}
                    onClick={() => go(`${manageHref}?section=webhooks`)}
                  >
                    Webhooks
                  </DropdownItem>
                )}
                {canDelete && (
                  <DropdownItem
                    icon={<Users size={14} />}
                    onClick={() => go(`${manageHref}?section=team`)}
                  >
                    Change team
                  </DropdownItem>
                )}
                {canDelete && (
                  <DropdownItem
                    icon={<Trash2 size={14} />}
                    danger
                    onClick={() => go(`${manageHref}?section=danger`)}
                  >
                    Delete
                  </DropdownItem>
                )}
              </>
            )}
          </Dropdown>
        </div>
      </div>
    </div>
  );
}

export interface TeamBot {
  bot: IndexBot;
  team: Team;
  canManage: boolean;
  myFlags: string[];
}

export function BotsTab({
  bots: botList,
  teamBots: teamBotList,
}: {
  bots: IndexBot[];
  teamBots: TeamBot[];
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<ListingSort>("votes");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [ownership, setOwnership] = useState<OwnershipFilter>("all");
  if (botList.length === 0 && teamBotList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Bot size={32} className="mb-3 text-zinc-300 dark:text-zinc-700" />
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          You haven&apos;t listed any bots yet.
        </p>
        <Link href="/bots/add" className="mt-4">
          <Button variant="secondary" size="sm">
            Add a Bot
          </Button>
        </Link>
      </div>
    );
  }

  const entries = [
    ...botList.map((bot) => ({
      bot,
      team: undefined as Team | undefined,
      canManage: true,
      myFlags: ["owner"],
    })),
    ...teamBotList,
  ];
  const ownershipCounts = {
    all: entries.length,
    mine: botList.length,
    team: teamBotList.length,
  };
  const byOwnership = entries.filter((e) =>
    ownership === "all" ? true : ownership === "mine" ? !e.team : !!e.team,
  );
  const statusCounts: Record<StatusFilter, number> = {
    all: byOwnership.length,
    live: byOwnership.filter((e) => matchesStatus(e.bot.type, "live")).length,
    review: byOwnership.filter((e) => matchesStatus(e.bot.type, "review"))
      .length,
    denied: byOwnership.filter((e) => matchesStatus(e.bot.type, "denied"))
      .length,
  };
  const needle = query.trim().toLowerCase();
  const visible = byOwnership
    .filter((e) => matchesStatus(e.bot.type, status))
    .filter(
      (e) =>
        !needle ||
        e.bot.user.username.toLowerCase().includes(needle) ||
        e.bot.bot_id.includes(needle) ||
        (e.team?.name ?? "").toLowerCase().includes(needle),
    )
    .sort((a, b) =>
      sort === "name"
        ? a.bot.user.username.localeCompare(b.bot.user.username)
        : sort === "newest"
          ? new Date(b.bot.created_at).getTime() -
            new Date(a.bot.created_at).getTime()
          : b.bot.approximate_votes - a.bot.approximate_votes,
    );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {formatCountLabel(entries.length, "bot")}
          {teamBotList.length > 0 &&
            ` (${formatCount(botList.length)} yours, ${formatCount(teamBotList.length)} through teams)`}
        </p>
        <Link href="/bots/add">
          <Button variant="secondary" size="sm">
            Add a Bot
          </Button>
        </Link>
      </div>

      <ListingFilters
        query={query}
        onQuery={setQuery}
        placeholder="Search your bots by name, ID or team"
        sort={sort}
        onSort={setSort}
        status={status}
        onStatus={setStatus}
        statusCounts={statusCounts}
        ownership={teamBotList.length > 0 ? ownership : undefined}
        onOwnership={setOwnership}
        ownershipCounts={ownershipCounts}
      />

      {visible.length === 0 ? (
        <p className="py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
          No bots match these filters.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map(({ bot, team, canManage, myFlags }) => (
            <BotItem
              key={`${team?.id ?? "mine"}-${bot.bot_id}`}
              bot={bot}
              team={team}
              canManage={canManage}
              myFlags={myFlags}
            />
          ))}
        </div>
      )}
    </div>
  );
}
