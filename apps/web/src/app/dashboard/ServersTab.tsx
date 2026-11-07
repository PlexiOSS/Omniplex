"use client";

import type { IndexServer, Team } from "@omniplex/core/api/types";
import { hasAnyPermString, hasPermString } from "@omniplex/core/permissions";
import { mirroredAvatarUrl } from "@omniplex/core/utils/assets";
import { formatCountLabel } from "@omniplex/core/utils/format";
import { Avatar } from "@omniplex/ui/Avatar";
import { Badge } from "@omniplex/ui/Badge";
import { Button } from "@omniplex/ui/Button";
import { Dropdown, DropdownItem } from "@omniplex/ui/Dropdown";
import {
  ArrowUpRight,
  BarChart2,
  KeyRound,
  MoreHorizontal,
  Server as ServerIcon,
  Settings,
  ShoppingBag,
  Sparkles,
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
  type StatusFilter,
} from "./ListingFilters";

export interface TeamServer {
  server: IndexServer;
  team: Team;
  canManage: boolean;
  myFlags: string[];
}

function ServerItem({
  server,
  team,
  canManage,
  myFlags,
}: {
  server: IndexServer;
  team: Team;
  canManage: boolean;
  myFlags: string[];
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const manageHref = `/dashboard/servers/${server.server_id}`;
  const canSeeTokens = hasAnyPermString(myFlags, [
    "view_sessions",
    "manage_sessions",
  ]);
  const canSeeWebhooks = hasAnyPermString(myFlags, [
    "view_webhooks",
    "manage_webhooks",
  ]);
  const canDelete = hasPermString(myFlags, "delete_servers");
  const avatarSrc = mirroredAvatarUrl(
    "servers",
    server.server_id,
    server.avatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(server.name)}&size=64&background=random`,
  );

  function go(href: string) {
    setMenuOpen(false);
    router.push(href);
  }

  return (
    <div className="flex min-w-0 flex-col rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start gap-3">
        <Avatar src={avatarSrc} alt={server.name} size={44} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold truncate text-zinc-950 dark:text-zinc-50">
              {server.name}
            </span>
            {server.premium && <Badge variant="premium">Premium</Badge>}
            {server.type === "certified" && (
              <Badge variant="success">Certified</Badge>
            )}
            {server.type === "pending" && (
              <Badge variant="warning">Pending</Badge>
            )}
          </div>
          <p className="mt-0.5 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
            {server.short}
          </p>
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-600">
            <Users size={11} />
            via {team.name}
            {!canManage && " · view only"}
          </div>
        </div>
      </div>

      {server.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {server.tags.slice(0, 4).map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
      )}

      <div className="min-h-4 flex-1" />
      <div className="-mx-4 -mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-b-[15px] border-t border-zinc-100 bg-zinc-50/60 px-4 py-2.5 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-400">
        <span className="whitespace-nowrap">
          {formatCountLabel(server.approximate_votes, "vote")}
        </span>
        <div className="flex items-center gap-2">
          <Link
            href={`/servers/${server.vanity || server.server_id}`}
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
            {!server.premium &&
              (server.type === "approved" || server.type === "certified") && (
                <DropdownItem
                  icon={<Sparkles size={14} />}
                  onClick={() => go(`/shop/premium?server=${server.server_id}`)}
                >
                  Upgrade
                </DropdownItem>
              )}
            <DropdownItem
              icon={<ShoppingBag size={14} />}
              onClick={() => go(`/shop/items?server=${server.server_id}`)}
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

export function ServersTab({ teamServers }: { teamServers: TeamServer[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<ListingSort>("votes");
  const [status, setStatus] = useState<StatusFilter>("all");

  if (teamServers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <ServerIcon
          size={32}
          className="mb-3 text-zinc-300 dark:text-zinc-700"
        />
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          You don&apos;t have access to any listed servers yet.
        </p>
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-600">
          Servers are owned by teams. Add one to create a team automatically.
        </p>
        <Link href="/servers/add" className="mt-4">
          <Button variant="secondary" size="sm">
            Add a Server
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {formatCountLabel(teamServers.length, "server")}
        </p>
        <Link href="/servers/add">
          <Button variant="secondary" size="sm">
            Add a Server
          </Button>
        </Link>
      </div>
      <ListingFilters
        query={query}
        onQuery={setQuery}
        placeholder="Search your servers by name, ID or team"
        sort={sort}
        onSort={setSort}
        status={status}
        onStatus={setStatus}
        statusCounts={{
          all: teamServers.length,
          live: teamServers.filter((e) => matchesStatus(e.server.type, "live"))
            .length,
          review: teamServers.filter((e) =>
            matchesStatus(e.server.type, "review"),
          ).length,
          denied: teamServers.filter((e) =>
            matchesStatus(e.server.type, "denied"),
          ).length,
        }}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {teamServers
          .filter((e) => matchesStatus(e.server.type, status))
          .filter((e) => {
            const needle = query.trim().toLowerCase();
            return (
              !needle ||
              e.server.name.toLowerCase().includes(needle) ||
              e.server.server_id.includes(needle) ||
              e.team.name.toLowerCase().includes(needle)
            );
          })
          .sort((a, b) =>
            sort === "name"
              ? a.server.name.localeCompare(b.server.name)
              : sort === "votes"
                ? b.server.approximate_votes - a.server.approximate_votes
                : 0,
          )
          .map(({ server, team, canManage, myFlags }) => (
            <ServerItem
              key={server.server_id}
              server={server}
              team={team}
              canManage={canManage}
              myFlags={myFlags}
            />
          ))}
      </div>
    </div>
  );
}
