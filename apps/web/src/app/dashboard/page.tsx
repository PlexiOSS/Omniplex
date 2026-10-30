"use client";

import {
  ArrowUpRight,
  BarChart2,
  Bell,
  Bot,
  ClipboardList,
  KeyRound,
  LayoutDashboard,
  LayoutTemplate,
  Megaphone,
  MoreHorizontal,
  Package,
  Palette,
  Repeat,
  Server as ServerIcon,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Terminal,
  Trash2,
  User,
  Users,
  Webhook as WebhookIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { LinksEditor } from "@/components/forms/LinksEditor";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { TokenManager } from "@/components/sessions/TokenManager";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dropdown, DropdownItem } from "@/components/ui/Dropdown";
import { Skeleton } from "@/components/ui/Skeleton";
import { useMyApplications } from "@/hooks/useApplications";
import { useAuth } from "@/hooks/useAuth";
import { useMe } from "@/hooks/useMe";
import { useMyTemplates } from "@/hooks/useTemplates";
import { useMyThemes } from "@/hooks/useThemes";
import { platform, users } from "@/lib/api";
import type {
  Link as ApiLink,
  BotType,
  IndexBot,
  IndexServer,
  Team,
  User as UserType,
} from "@/lib/api/types";
import { hasAnyPermString, hasPermString } from "@/lib/permissions";
import { mirroredAvatarUrl, teamAvatarUrl } from "@/lib/utils/assets";
import { formatCount, formatCountLabel } from "@/lib/utils/format";
import { ApplicationsTab } from "./ApplicationsTab";
import { AutoVoteTab } from "./AutoVoteTab";
import { DashboardNav } from "./DashboardNav";
import {
  ListingFilters,
  type ListingSort,
  matchesStatus,
  type OwnershipFilter,
  type StatusFilter,
} from "./ListingFilters";
import {
  FormMessage,
  SettingsCard,
  TextArea,
  Toggle,
} from "./manage/ManageShell";
import { NotificationsTab } from "./NotificationsTab";
import { OverviewPanel } from "./OverviewPanel";
import { PacksTab } from "./PacksTab";
import { SecurityTab } from "./SecurityTab";
import { TemplatesTab } from "./TemplatesTab";
import { ThemesTab } from "./ThemesTab";

type Tab =
  | "overview"
  | "auto-vote"
  | "profile"
  | "bots"
  | "servers"
  | "packs"
  | "templates"
  | "themes"
  | "applications"
  | "teams"
  | "sessions"
  | "notifications"
  | "security";

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

function DashboardSkeleton() {
  return (
    <Container className="py-10">
      <div className="flex items-start gap-4 mb-8">
        <Skeleton className="w-16 h-16 rounded-full" />
        <div className="pt-1 space-y-2">
          <Skeleton className="w-40 h-6" />
          <Skeleton className="w-24 h-4" />
        </div>
      </div>
      <Skeleton className="w-full h-10 mb-8" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {["a", "b", "c"].map((key) => (
          <Skeleton key={key} className="h-40 rounded-xl" />
        ))}
      </div>
    </Container>
  );
}

function EditProfileTab({
  me,
  token,
  mutate,
}: {
  me: UserType;
  token: string;
  mutate: () => void;
}) {
  // Links starting with "_" are private (system-managed) — this editor only
  // manages the public ones a user advertises on their profile. Private
  // links are carried through unchanged on save.
  const privateLinks = me.extra_links.filter((l) => l.name.startsWith("_"));
  const [about, setAbout] = useState(me.about ?? "");
  const [links, setLinks] = useState<ApiLink[]>(
    me.extra_links.filter((l) => !l.name.startsWith("_")),
  );
  const [captchaSponsorEnabled, setCaptchaSponsorEnabled] = useState(
    me.captcha_sponsor_enabled,
  );
  const pinOptions = [
    ...me.user_bots.map((b) => ({
      key: `bot:${b.bot_id}`,
      label: `${b.user?.username ?? b.bot_id} (bot)`,
    })),
    ...me.user_teams.flatMap((t) =>
      (t.entities?.bots ?? []).map((b) => ({
        key: `bot:${b.bot_id}`,
        label: `${b.user?.username ?? b.bot_id} (bot, ${t.name})`,
      })),
    ),
    ...me.user_servers.map((sv) => ({
      key: `server:${sv.server_id}`,
      label: `${sv.name} (server)`,
    })),
  ].filter((o, i, all) => all.findIndex((x) => x.key === o.key) === i);
  const [pinned, setPinned] = useState(
    me.pinned_target_type && me.pinned_target_id
      ? `${me.pinned_target_type}:${me.pinned_target_id}`
      : "",
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshingDiscord, setRefreshingDiscord] = useState(false);
  const [discordRefreshed, setDiscordRefreshed] = useState(false);

  async function handleRefreshDiscord() {
    const discordId = me.user?.id;
    if (!discordId) return;
    setRefreshingDiscord(true);
    setDiscordRefreshed(false);
    try {
      await platform.clearDiscordUser(discordId);
      mutate();
      setDiscordRefreshed(true);
      setTimeout(() => setDiscordRefreshed(false), 3000);
    } catch {
      // Best-effort — the cache just stays as it was.
    } finally {
      setRefreshingDiscord(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const cleanLinks = links.filter(
        (l) => l.name.trim() !== "" && l.value.trim() !== "",
      );
      const extra_links: ApiLink[] = [...privateLinks, ...cleanLinks];
      await users.updateUser(
        me.user?.id ?? "",
        {
          about: about || null,
          extra_links,
          captcha_sponsor_enabled: captchaSponsorEnabled,
          pinned_listing: pinned
            ? {
                target_type: pinned.split(":")[0] as "bot" | "server",
                target_id: pinned.split(":")[1] ?? "",
              }
            : { target_type: "", target_id: "" },
        },
        token,
      );
      mutate();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  const previewName = me.user?.display_name || me.user?.username || "Unknown";
  const previewLinks = links.filter((l) => l.name.trim() && l.value.trim());

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="min-w-0 space-y-4">
        <SettingsCard
          title="Profile"
          description="What people see on your public profile."
          footer={
            <>
              <FormMessage error={error} success={saved ? "Saved." : null} />
              <Button variant="primary" loading={saving} onClick={handleSave}>
                Save changes
              </Button>
            </>
          }
        >
          <TextArea
            id="about"
            label="Bio (Markdown supported)"
            rows={3}
            value={about}
            onChange={setAbout}
          />
          {pinOptions.length > 0 && (
            <div>
              <label
                htmlFor="pinned-listing"
                className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Pinned listing
              </label>
              <select
                id="pinned-listing"
                value={pinned}
                onChange={(e) => setPinned(e.target.value)}
                className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
              >
                <option value="">None</option>
                {pinOptions.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Shown at the top of your public profile.
              </p>
            </div>
          )}
          <div>
            <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Links
            </p>
            <LinksEditor links={links} onChange={setLinks} />
          </div>
          <Toggle
            checked={captchaSponsorEnabled}
            onChange={setCaptchaSponsorEnabled}
            label="Sponsor captchas"
            description="Show a captcha before voting even on bots and servers that have opted out of them."
          />
        </SettingsCard>

        <SettingsCard
          title="Discord profile"
          description="Username or avatar out of date? This refreshes the copy we show across the site."
          footer={
            <Button
              variant="secondary"
              size="sm"
              loading={refreshingDiscord}
              onClick={handleRefreshDiscord}
            >
              {discordRefreshed ? "Refreshed" : "Refresh from Discord"}
            </Button>
          }
        />
      </div>

      <aside className="xl:sticky xl:top-24 xl:self-start">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Preview
        </p>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <Avatar
              src={mirroredAvatarUrl(
                "users",
                me.user?.id ?? "",
                me.user?.avatar,
              )}
              alt={previewName}
              size={48}
            />
            <div className="min-w-0">
              <p className="truncate font-semibold text-zinc-950 dark:text-zinc-50">
                {previewName}
              </p>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                @{me.user?.username}
              </p>
            </div>
          </div>
          <p className="mt-3 whitespace-pre-line text-sm text-zinc-600 dark:text-zinc-300">
            {about.trim() || (
              <span className="text-zinc-400 dark:text-zinc-500">
                No bio yet.
              </span>
            )}
          </p>
          {previewLinks.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">
              {previewLinks.map((link) => (
                <span
                  key={link.name}
                  className="text-xs font-medium capitalize text-accent"
                >
                  {link.name}
                </span>
              ))}
            </div>
          )}
        </div>
        <Link
          href={`/user/${me.user?.id ?? ""}`}
          className="mt-3 inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-accent dark:text-zinc-400"
        >
          View public profile <ArrowUpRight size={13} />
        </Link>
      </aside>
    </div>
  );
}

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
      <div className="-mx-4 -mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-b-[15px] border-t border-zinc-100 bg-zinc-50/60 px-4 py-2.5 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-400">
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
                  onClick={() => go(`/premium?bot=${bot.bot_id}`)}
                >
                  Upgrade
                </DropdownItem>
              )}
            <DropdownItem
              icon={<ShoppingBag size={14} />}
              onClick={() => go(`/shop?bot=${bot.bot_id}`)}
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

interface TeamBot {
  bot: IndexBot;
  team: Team;
  canManage: boolean;
  myFlags: string[];
}

function BotsTab({
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

interface TeamServer {
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
                  onClick={() => go(`/premium?server=${server.server_id}`)}
                >
                  Upgrade
                </DropdownItem>
              )}
            <DropdownItem
              icon={<ShoppingBag size={14} />}
              onClick={() => go(`/shop?server=${server.server_id}`)}
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

function ServersTab({ teamServers }: { teamServers: TeamServer[] }) {
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

function TeamsTab({ teams, userId }: { teams: Team[]; userId: string }) {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {formatCountLabel(teams.length, "team")}
        </p>
        <Link href="/teams/add">
          <Button variant="secondary" size="sm">
            Create Team
          </Button>
        </Link>
      </div>

      {teams.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users size={32} className="mb-3 text-zinc-300 dark:text-zinc-700" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            You aren&apos;t in any teams yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {teams.map((team) => {
            const members = team.entities?.members ?? [];
            const myFlags =
              members.find((m) => m.user?.id === userId)?.flags ?? [];
            const isOwner = hasPermString(myFlags, "owner");
            return (
              <div
                key={team.id}
                className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    src={teamAvatarUrl(team.id, team.asset_versions?.avatar)}
                    alt={team.name}
                    size={40}
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/teams/${team.vanity || team.id}`}
                      className="block truncate font-semibold text-zinc-950 transition-colors hover:text-accent dark:text-zinc-50"
                    >
                      {team.name}
                    </Link>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {isOwner ? "Owner" : "Member"}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                  {[
                    formatCountLabel(members.length, "member"),
                    formatCountLabel(team.entities?.bots?.length ?? 0, "bot"),
                    formatCountLabel(
                      team.entities?.servers?.length ?? 0,
                      "server",
                    ),
                  ].join(" · ")}
                </p>
                <div className="min-h-4 flex-1" />
                <div className="-mx-4 -mb-4 flex items-center justify-between gap-3 border-t border-zinc-100 bg-zinc-50/60 px-4 py-2.5 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-400">
                  <Link
                    href={`/teams/${team.vanity || team.id}`}
                    className="inline-flex items-center gap-1 transition-colors hover:text-zinc-900 dark:hover:text-zinc-50"
                  >
                    View
                    <ArrowUpRight size={11} />
                  </Link>
                  <Link
                    href={`/teams/${team.id}/settings`}
                    className="inline-flex h-7 items-center gap-1 rounded-lg px-2 font-medium transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                  >
                    <Settings size={12} />
                    Settings
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const NAV_GROUPS: {
  label: string;
  items: { key: Tab; label: string; icon: typeof LayoutDashboard }[];
}[] = [
  {
    label: "Account",
    items: [
      { key: "overview", label: "Overview", icon: LayoutDashboard },
      { key: "profile", label: "Profile", icon: User },
      { key: "notifications", label: "Notifications", icon: Bell },
      { key: "security", label: "Security", icon: ShieldCheck },
      { key: "sessions", label: "Sessions", icon: KeyRound },
    ],
  },
  {
    label: "Listings",
    items: [
      { key: "bots", label: "Bots", icon: Bot },
      { key: "servers", label: "Servers", icon: ServerIcon },
      { key: "packs", label: "Packs", icon: Package },
      { key: "templates", label: "Templates", icon: LayoutTemplate },
      { key: "themes", label: "Themes", icon: Palette },
      { key: "teams", label: "Teams", icon: Users },
    ],
  },
  {
    label: "Activity",
    items: [
      { key: "auto-vote", label: "Auto-vote", icon: Repeat },
      { key: "applications", label: "Applications", icon: ClipboardList },
    ],
  },
];

const TABS = NAV_GROUPS.flatMap((g) => g.items);

const VALID_TABS = new Set(TABS.map((t) => t.key));

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardPageInner />
    </Suspense>
  );
}

function DashboardPageInner() {
  const { session, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab");
  const requestedTab = rawTab === "tokens" ? "sessions" : rawTab;
  const tab: Tab =
    requestedTab && VALID_TABS.has(requestedTab as Tab)
      ? (requestedTab as Tab)
      : "overview";
  const setTab = (next: Tab) => {
    router.replace(
      next === "overview" ? "/dashboard" : `/dashboard?tab=${next}`,
      {
        scroll: false,
      },
    );
    window.scrollTo({ top: 0 });
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [authLoading, isAuthenticated, router]);

  const { me, loading: meLoading, mutate } = useMe(session);
  const { apps: myApplications } = useMyApplications(session);
  const { templates: myTemplates, mutate: mutateTemplates } =
    useMyTemplates(session);
  const { themes: myThemes, mutate: mutateThemes } = useMyThemes(session);

  if (authLoading || meLoading || !session) {
    return <DashboardSkeleton />;
  }

  if (!me) {
    return (
      <Container className="flex flex-col items-center justify-center flex-1 py-24">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Failed to load your profile.{" "}
          <button
            type="button"
            onClick={() => mutate()}
            className="underline underline-offset-2 hover:text-zinc-900 dark:hover:text-zinc-50"
          >
            Try again
          </button>
        </p>
      </Container>
    );
  }

  // Popplio can return `null` instead of `[]` for these resolved-in-application-code
  // fields when the underlying Go slice is nil — normalize once here so every
  // tab below can rely on them always being arrays.
  const normalizedMe: UserType = {
    ...me,
    extra_links: me.extra_links ?? [],
    user_bots: me.user_bots ?? [],
    user_packs: me.user_packs ?? [],
    user_teams: me.user_teams ?? [],
  };

  const displayName =
    normalizedMe.user?.display_name || normalizedMe.user?.username || "Unknown";
  const username = normalizedMe.user?.username ?? "unknown";
  const avatar = normalizedMe.user?.avatar ?? "";

  // Bots owned by teams the user belongs to, alongside directly-owned bots.
  // Each team's `entities.bots` is already resolved by the API; we just need
  // to figure out whether the current user can manage them.
  const seenBots = new Set(normalizedMe.user_bots.map((b) => b.bot_id));
  const teamBots: TeamBot[] = normalizedMe.user_teams.flatMap((team) => {
    const myFlags =
      team.entities?.members?.find((m) => m.user?.id === session.user_id)
        ?.flags ?? [];
    const canManage = hasPermString(myFlags, "edit_bots");
    return (team.entities?.bots ?? [])
      .filter((bot) => {
        if (seenBots.has(bot.bot_id)) return false;
        seenBots.add(bot.bot_id);
        return true;
      })
      .map((bot) => ({
        bot,
        team,
        canManage,
        myFlags,
      }));
  });

  // Servers are always team-owned (no direct-ownership equivalent to a
  // bot's `owner` field), so this is the only source of listed servers.
  const seenServers = new Set<string>();
  const teamServers: TeamServer[] = normalizedMe.user_teams.flatMap((team) => {
    const myFlags =
      team.entities?.members?.find((m) => m.user?.id === session.user_id)
        ?.flags ?? [];
    const canManage = hasPermString(myFlags, "edit_servers");
    return (team.entities?.servers ?? [])
      .filter((server) => {
        if (seenServers.has(server.server_id)) return false;
        seenServers.add(server.server_id);
        return true;
      })
      .map((server) => ({
        server,
        team,
        canManage,
        myFlags,
      }));
  });

  const counts: Partial<Record<Tab, number>> = {
    bots: normalizedMe.user_bots.length + teamBots.length,
    servers: teamServers.length,
    packs: normalizedMe.user_packs.length,
    templates: myTemplates.length,
    themes: myThemes.length,
    applications: myApplications.length,
    teams: normalizedMe.user_teams.length,
  };
  const navGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.map((item) => ({ ...item, count: counts[item.key] })),
  }));
  const activeItem = NAV_GROUPS.flatMap((g) => g.items).find(
    (i) => i.key === tab,
  );

  return (
    <Container className="py-10">
      <div className="grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
            <Avatar
              src={mirroredAvatarUrl("users", session.user_id, avatar)}
              alt={username}
              size={40}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                {displayName}
              </p>
              <Link
                href={`/user/${session.user_id}`}
                className="inline-flex items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-accent dark:text-zinc-400"
              >
                View profile <ArrowUpRight size={11} />
              </Link>
            </div>
          </div>
          <DashboardNav groups={navGroups} active={tab} onSelect={setTab} />
        </aside>

        <div className="min-w-0">
          <PageHeader
            icon={activeItem?.icon ?? LayoutDashboard}
            title={activeItem?.label ?? "Overview"}
          />

          {tab === "overview" && (
            <OverviewPanel
              userId={session.user_id}
              token={session.token}
              bots={[...normalizedMe.user_bots, ...teamBots.map((t) => t.bot)]}
              servers={teamServers.map((t) => t.server)}
              onNavigate={setTab}
            />
          )}
          {tab === "profile" && (
            <EditProfileTab
              me={normalizedMe}
              token={session.token}
              mutate={mutate}
            />
          )}
          {tab === "bots" && (
            <BotsTab bots={normalizedMe.user_bots} teamBots={teamBots} />
          )}
          {tab === "servers" && <ServersTab teamServers={teamServers} />}
          {tab === "packs" && (
            <PacksTab
              packs={normalizedMe.user_packs}
              userId={session.user_id}
              userBots={normalizedMe.user_bots}
              token={session.token}
              mutate={mutate}
            />
          )}
          {tab === "templates" && (
            <TemplatesTab
              templates={myTemplates}
              userId={session.user_id}
              token={session.token}
              mutate={mutateTemplates}
            />
          )}
          {tab === "themes" && (
            <ThemesTab
              themes={myThemes}
              userId={session.user_id}
              token={session.token}
              mutate={mutateThemes}
            />
          )}
          {tab === "auto-vote" && (
            <AutoVoteTab userId={session.user_id} token={session.token} />
          )}
          {tab === "applications" && <ApplicationsTab apps={myApplications} />}
          {tab === "teams" && (
            <TeamsTab
              teams={normalizedMe.user_teams}
              userId={session.user_id}
            />
          )}
          {tab === "sessions" && (
            <div>
              <p className="mb-6 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
                Everything that can act as you: API tokens you&apos;ve created,
                and the devices you&apos;re signed in on. For a bot or server
                token, use the Tokens button on that listing in Bots or Servers.
              </p>
              <TokenManager
                targetType="user"
                targetId={session.user_id}
                authToken={session.token}
                myPerms={["owner"]}
                isSelf
              />
            </div>
          )}
          {tab === "notifications" && (
            <NotificationsTab userId={session.user_id} token={session.token} />
          )}
          {tab === "security" && (
            <SecurityTab
              userId={session.user_id}
              username={username}
              token={session.token}
            />
          )}
        </div>
      </div>
    </Container>
  );
}
