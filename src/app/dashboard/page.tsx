"use client";

import {
  ArrowUpRight,
  BarChart2,
  Bell,
  Bot,
  ClipboardList,
  GitBranch,
  Globe,
  KeyRound,
  LayoutDashboard,
  LayoutTemplate,
  Megaphone,
  MoreHorizontal,
  Package,
  Palette,
  Pencil,
  Server as ServerIcon,
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
import { Suspense, useEffect, useRef, useState } from "react";
import { TeamCard } from "@/components/cards/TeamCard";
import { LinksEditor } from "@/components/forms/LinksEditor";
import { Container } from "@/components/layout/Container";
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
import { bots, platform, users } from "@/lib/api";
import type {
  Link as ApiLink,
  BotType,
  IndexBot,
  IndexServer,
  Team,
  User as UserType,
} from "@/lib/api/types";
import { hasAnyPermString, hasPermString } from "@/lib/permissions";
import { mirroredAvatarUrl } from "@/lib/utils/assets";
import { formatCount } from "@/lib/utils/format";
import { ApplicationsTab } from "./ApplicationsTab";
import { BotEditModal } from "./BotEditModal";
import { NotificationsTab } from "./NotificationsTab";
import { PacksTab } from "./PacksTab";
import { SecurityTab } from "./SecurityTab";
import { ServerEditModal } from "./ServerEditModal";
import { BotStatsModal, ServerStatsModal } from "./StatsModal";
import { TemplatesTab } from "./TemplatesTab";
import { ThemesTab } from "./ThemesTab";
import { TokenModal } from "./TokenModal";
import { TransferTeamModal } from "./TransferTeamModal";
import { WebhookModal } from "./WebhookModal";

type Tab =
  | "overview"
  | "profile"
  | "bots"
  | "servers"
  | "packs"
  | "templates"
  | "themes"
  | "applications"
  | "teams"
  | "tokens"
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {["a", "b", "c"].map((key) => (
          <Skeleton key={key} className="h-40 rounded-xl" />
        ))}
      </div>
    </Container>
  );
}

function OverviewTab({ me }: { me: UserType }) {
  const websiteLink = me.extra_links.find((l) => l.name === "website")?.value;
  const githubLink = me.extra_links.find((l) => l.name === "github")?.value;

  return (
    <div className="space-y-8">
      {me.about && (
        <p className="max-w-xl text-sm text-zinc-600 dark:text-zinc-300">
          {me.about}
        </p>
      )}

      <div className="flex flex-wrap gap-4">
        {websiteLink && (
          <a
            href={websiteLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            <Globe size={13} />
            {websiteLink}
          </a>
        )}
        {githubLink && (
          <a
            href={githubLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            <GitBranch size={13} />
            {githubLink}
          </a>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          {
            icon: <Bot size={14} />,
            label: "Bots",
            value: me.user_bots.length,
          },
          {
            icon: <Package size={14} />,
            label: "Packs",
            value: me.user_packs.length,
          },
          {
            icon: <Users size={14} />,
            label: "Teams",
            value: me.user_teams.length,
          },
        ].map(({ icon, label, value }) => (
          <div
            key={label}
            className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-600">
              {icon}
              <span className="text-xs font-medium uppercase tracking-wide">
                {label}
              </span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div>
        <Link
          href={`/user/${me.user?.id ?? ""}`}
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          View public profile
          <ArrowUpRight size={13} />
        </Link>
      </div>
    </div>
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

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div>
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Discord username or avatar out of date?
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-600">
            Refreshes the cached copy we show across the site.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          loading={refreshingDiscord}
          onClick={handleRefreshDiscord}
        >
          {discordRefreshed ? "Refreshed!" : "Refresh"}
        </Button>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="about"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Bio
        </label>
        <textarea
          id="about"
          rows={3}
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          placeholder="Tell the community a bit about yourself…"
          className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-400 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600"
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Links
        </p>
        <LinksEditor links={links} onChange={setLinks} />
      </div>

      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={captchaSponsorEnabled}
          onChange={(e) => setCaptchaSponsorEnabled(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-zinc-300 accent-accent dark:border-zinc-700"
        />
        <span className="text-sm text-zinc-700 dark:text-zinc-300">
          Sponsor captchas
          <span className="block text-xs text-zinc-400">
            Show a captcha before voting even on bots and servers that have
            opted out of them.
          </span>
        </span>
      </label>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <Button variant="primary" loading={saving} onClick={handleSave}>
        {saved ? "Saved!" : "Save Changes"}
      </Button>
    </div>
  );
}

function BotItem({
  bot,
  token,
  userId,
  onDeleted,
  mutate,
  team,
  userTeams = [],
  canManage = true,
  myFlags = ["owner"],
}: {
  bot: IndexBot;
  token: string;
  /** Needed for the team-transfer endpoint, which is path-scoped to the acting user. */
  userId: string;
  onDeleted: (id: string) => void;
  mutate: () => void;
  /** Set when this bot is owned by a team the user is a member of, rather than owned directly. */
  team?: Team;
  /** Every team the user belongs to — used to build the "Change Team" destination picker. */
  userTeams?: Team[];
  /** Whether the current user has permission to edit/delete this bot. Always true for directly-owned bots. */
  canManage?: boolean;
  /** The current user's resolved flags on this bot's team — defaults to owner for directly-owned bots. */
  myFlags?: string[];
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [editing, setEditing] = useState(false);
  const [viewingStats, setViewingStats] = useState(false);
  const [viewingTokens, setViewingTokens] = useState(false);
  const [viewingWebhooks, setViewingWebhooks] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const confirmRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canSeeTokens = hasAnyPermString(myFlags, [
    "view_sessions",
    "manage_sessions",
  ]);
  const canSeeWebhooks = hasAnyPermString(myFlags, [
    "view_webhooks",
    "manage_webhooks",
  ]);
  const canManageWebhooks = hasPermString(myFlags, "manage_webhooks");
  const canViewWebhookLogs = hasPermString(myFlags, "view_webhook_logs");
  const canTransferTeam = hasPermString(myFlags, "delete_bots");
  const transferCandidates = userTeams.filter((t) => {
    if (team && t.id === team.id) return false;
    const theirFlags =
      t.entities?.members?.find((m) => m.user?.id === userId)?.flags ?? [];
    return hasPermString(theirFlags, "add_bots");
  });

  const status = BOT_STATUS[bot.type];

  function handleDeleteClick() {
    if (!confirming) {
      setConfirming(true);
      confirmRef.current = setTimeout(() => setConfirming(false), 3000);
      return;
    }
    if (confirmRef.current) clearTimeout(confirmRef.current);
    setConfirming(false);
    setDeleting(true);
    bots
      .deleteBot(bot.bot_id, token)
      .then(() => {
        setMenuOpen(false);
        onDeleted(bot.bot_id);
      })
      .catch(() => setDeleting(false));
  }

  return (
    <div className="flex flex-col p-4 bg-white border rounded-xl border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900">
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

      <div className="flex items-center justify-between pt-3 mt-auto text-xs text-zinc-500 dark:text-zinc-400">
        <span>{formatCount(bot.approximate_votes)} votes</span>
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
              onClick={() => setEditing(true)}
              className="px-2 text-xs h-7"
            >
              <Pencil size={12} />
              Edit
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
                  onClick={() => {
                    setMenuOpen(false);
                    router.push(`/premium?bot=${bot.bot_id}`);
                  }}
                >
                  Upgrade
                </DropdownItem>
              )}
            <DropdownItem
              icon={<ShoppingBag size={14} />}
              onClick={() => {
                setMenuOpen(false);
                router.push(`/shop?bot=${bot.bot_id}`);
              }}
            >
              Shop
            </DropdownItem>
            <DropdownItem
              icon={<BarChart2 size={14} />}
              onClick={() => {
                setMenuOpen(false);
                setViewingStats(true);
              }}
            >
              Stats
            </DropdownItem>
            {canManage && (
              <DropdownItem
                icon={<Terminal size={14} />}
                onClick={() => {
                  setMenuOpen(false);
                  router.push(`/bots/${bot.vanity || bot.bot_id}?tab=commands`);
                }}
              >
                Commands
              </DropdownItem>
            )}
            {canManage && (
              <DropdownItem
                icon={<Megaphone size={14} />}
                onClick={() => {
                  setMenuOpen(false);
                  router.push(`/bots/${bot.vanity || bot.bot_id}?tab=changelog`);
                }}
              >
                Changelog
              </DropdownItem>
            )}
            {canSeeTokens && (
              <DropdownItem
                icon={<KeyRound size={14} />}
                onClick={() => {
                  setMenuOpen(false);
                  setViewingTokens(true);
                }}
              >
                Tokens
              </DropdownItem>
            )}
            {canSeeWebhooks && (
              <DropdownItem
                icon={<WebhookIcon size={14} />}
                onClick={() => {
                  setMenuOpen(false);
                  setViewingWebhooks(true);
                }}
              >
                Webhooks
              </DropdownItem>
            )}
            {canTransferTeam && (
              <DropdownItem
                icon={<Users size={14} />}
                onClick={() => {
                  setMenuOpen(false);
                  setTransferring(true);
                }}
              >
                Change Team
              </DropdownItem>
            )}
            {canManage && (
              <DropdownItem
                icon={<Trash2 size={14} />}
                danger
                loading={deleting}
                onClick={handleDeleteClick}
              >
                {confirming ? "Confirm?" : "Delete"}
              </DropdownItem>
            )}
          </Dropdown>
        </div>
      </div>

      {editing && (
        <BotEditModal
          botId={bot.bot_id}
          userId={userId}
          token={token}
          onClose={() => setEditing(false)}
          onSaved={mutate}
        />
      )}

      {viewingTokens && (
        <TokenModal
          title="Bot API Tokens"
          targetType="bot"
          targetId={bot.bot_id}
          authToken={token}
          myPerms={myFlags}
          onClose={() => setViewingTokens(false)}
        />
      )}

      {viewingWebhooks && (
        <WebhookModal
          title="Bot Webhooks"
          targetType="bot"
          targetId={bot.bot_id}
          authToken={token}
          canManage={canManageWebhooks}
          canViewLogs={canViewWebhookLogs}
          onClose={() => setViewingWebhooks(false)}
        />
      )}

      {transferring && (
        <TransferTeamModal
          botId={bot.bot_id}
          userId={userId}
          token={token}
          candidates={transferCandidates}
          onClose={() => setTransferring(false)}
          onTransferred={mutate}
        />
      )}

      {viewingStats && (
        <BotStatsModal
          botId={bot.bot_id}
          onClose={() => setViewingStats(false)}
        />
      )}
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
  bots: allBots,
  teamBots: allTeamBots,
  token,
  userId,
  userTeams,
  mutate,
}: {
  bots: IndexBot[];
  teamBots: TeamBot[];
  token: string;
  userId: string;
  userTeams: Team[];
  mutate: () => void;
}) {
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const botList = allBots.filter((b) => !deletedIds.includes(b.bot_id));
  const teamBotList = allTeamBots.filter(
    (tb) => !deletedIds.includes(tb.bot.bot_id),
  );

  function handleDeleted(id: string) {
    setDeletedIds((prev) => [...prev, id]);
  }

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

  return (
    <div className="space-y-10">
      <div>
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {botList.length} {botList.length === 1 ? "bot" : "bots"}
          </p>
          <Link href="/bots/add">
            <Button variant="secondary" size="sm">
              Add a Bot
            </Button>
          </Link>
        </div>
        {botList.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {botList.map((bot) => (
              <BotItem
                key={bot.bot_id}
                bot={bot}
                token={token}
                userId={userId}
                userTeams={userTeams}
                mutate={mutate}
                onDeleted={handleDeleted}
              />
            ))}
          </div>
        )}
      </div>

      {teamBotList.length > 0 && (
        <div>
          <h3 className="mb-4 text-sm font-medium text-zinc-950 dark:text-zinc-50">
            Team Bots
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teamBotList.map(({ bot, team, canManage, myFlags }) => (
              <BotItem
                key={bot.bot_id}
                bot={bot}
                token={token}
                userId={userId}
                userTeams={userTeams}
                mutate={mutate}
                onDeleted={handleDeleted}
                team={team}
                canManage={canManage}
                myFlags={myFlags}
              />
            ))}
          </div>
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
  userId,
  token,
  mutate,
}: {
  server: IndexServer;
  team: Team;
  canManage: boolean;
  myFlags: string[];
  userId: string;
  token: string;
  mutate: () => void;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [viewingStats, setViewingStats] = useState(false);
  const [viewingTokens, setViewingTokens] = useState(false);
  const [viewingWebhooks, setViewingWebhooks] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const canSeeTokens = hasAnyPermString(myFlags, [
    "view_sessions",
    "manage_sessions",
  ]);
  const canSeeWebhooks = hasAnyPermString(myFlags, [
    "view_webhooks",
    "manage_webhooks",
  ]);
  const canManageWebhooks = hasPermString(myFlags, "manage_webhooks");
  const canViewWebhookLogs = hasPermString(myFlags, "view_webhook_logs");
  const avatarSrc = mirroredAvatarUrl(
    "servers",
    server.server_id,
    server.avatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(server.name)}&size=64&background=random`,
  );

  return (
    <div className="flex flex-col p-4 bg-white border rounded-xl border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900">
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

      <div className="flex items-center justify-between pt-3 mt-auto text-xs text-zinc-500 dark:text-zinc-400">
        <span>{formatCount(server.approximate_votes)} votes</span>
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
              onClick={() => setEditing(true)}
              className="px-2 text-xs h-7"
            >
              <Pencil size={12} />
              Edit
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
                  onClick={() => {
                    setMenuOpen(false);
                    router.push(`/premium?server=${server.server_id}`);
                  }}
                >
                  Upgrade
                </DropdownItem>
              )}
            <DropdownItem
              icon={<ShoppingBag size={14} />}
              onClick={() => {
                setMenuOpen(false);
                router.push(`/shop?server=${server.server_id}`);
              }}
            >
              Shop
            </DropdownItem>
            <DropdownItem
              icon={<BarChart2 size={14} />}
              onClick={() => {
                setMenuOpen(false);
                setViewingStats(true);
              }}
            >
              Stats
            </DropdownItem>
            {canSeeTokens && (
              <DropdownItem
                icon={<KeyRound size={14} />}
                onClick={() => {
                  setMenuOpen(false);
                  setViewingTokens(true);
                }}
              >
                Tokens
              </DropdownItem>
            )}
            {canSeeWebhooks && (
              <DropdownItem
                icon={<WebhookIcon size={14} />}
                onClick={() => {
                  setMenuOpen(false);
                  setViewingWebhooks(true);
                }}
              >
                Webhooks
              </DropdownItem>
            )}
          </Dropdown>
        </div>
      </div>

      {editing && (
        <ServerEditModal
          serverId={server.server_id}
          userId={userId}
          token={token}
          onClose={() => setEditing(false)}
          onSaved={mutate}
        />
      )}

      {viewingStats && (
        <ServerStatsModal
          serverId={server.server_id}
          onClose={() => setViewingStats(false)}
        />
      )}

      {viewingTokens && (
        <TokenModal
          title="Server API Tokens"
          targetType="server"
          targetId={server.server_id}
          authToken={token}
          myPerms={myFlags}
          onClose={() => setViewingTokens(false)}
        />
      )}

      {viewingWebhooks && (
        <WebhookModal
          title="Server Webhooks"
          targetType="server"
          targetId={server.server_id}
          authToken={token}
          canManage={canManageWebhooks}
          canViewLogs={canViewWebhookLogs}
          onClose={() => setViewingWebhooks(false)}
        />
      )}
    </div>
  );
}

function ServersTab({
  teamServers,
  userId,
  token,
  mutate,
}: {
  teamServers: TeamServer[];
  userId: string;
  token: string;
  mutate: () => void;
}) {
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
          Servers are owned by teams — add one to create a team automatically.
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
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {teamServers.length} {teamServers.length === 1 ? "server" : "servers"}
        </p>
        <Link href="/servers/add">
          <Button variant="secondary" size="sm">
            Add a Server
          </Button>
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {teamServers.map(({ server, team, canManage, myFlags }) => (
          <ServerItem
            key={server.server_id}
            server={server}
            team={team}
            canManage={canManage}
            myFlags={myFlags}
            userId={userId}
            token={token}
            mutate={mutate}
          />
        ))}
      </div>
    </div>
  );
}

function TeamsTab({ teams }: { teams: Team[] }) {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {teams.length} {teams.length === 1 ? "team" : "teams"}
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      )}
    </div>
  );
}

const TABS: { key: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "profile", label: "Edit Profile", icon: User },
  { key: "bots", label: "Bots", icon: Bot },
  { key: "servers", label: "Servers", icon: ServerIcon },
  { key: "packs", label: "Packs", icon: Package },
  { key: "templates", label: "Templates", icon: LayoutTemplate },
  { key: "themes", label: "Themes", icon: Palette },
  { key: "applications", label: "Applications", icon: ClipboardList },
  { key: "teams", label: "Teams", icon: Users },
  { key: "tokens", label: "API Tokens", icon: KeyRound },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "security", label: "Security", icon: ShieldCheck },
];

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
  const [tab, setTab] = useState<Tab>(() => {
    const requested = searchParams.get("tab");
    return requested && VALID_TABS.has(requested as Tab)
      ? (requested as Tab)
      : "overview";
  });

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
  const teamBots: TeamBot[] = normalizedMe.user_teams.flatMap((team) => {
    const myFlags =
      team.entities?.members?.find((m) => m.user?.id === session.user_id)
        ?.flags ?? [];
    const canManage = hasPermString(myFlags, "edit_bots");
    return (team.entities?.bots ?? []).map((bot) => ({
      bot,
      team,
      canManage,
      myFlags,
    }));
  });

  // Servers are always team-owned (no direct-ownership equivalent to a
  // bot's `owner` field), so this is the only source of listed servers.
  const teamServers: TeamServer[] = normalizedMe.user_teams.flatMap((team) => {
    const myFlags =
      team.entities?.members?.find((m) => m.user?.id === session.user_id)
        ?.flags ?? [];
    const canManage = hasPermString(myFlags, "edit_servers");
    return (team.entities?.servers ?? []).map((server) => ({
      server,
      team,
      canManage,
      myFlags,
    }));
  });

  return (
    <Container className="py-10">
      {/* Profile header */}
      <div className="flex items-start gap-4 mb-8">
        <Avatar
          src={mirroredAvatarUrl("users", session.user_id, avatar)}
          alt={username}
          size={64}
        />
        <div>
          <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
            {displayName}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            @{username}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {normalizedMe.staff && <Badge variant="info">Staff</Badge>}
            {normalizedMe.certified && (
              <Badge variant="success">Certified Dev</Badge>
            )}
            {normalizedMe.bot_developer && <Badge>Bot Developer</Badge>}
            {normalizedMe.bug_hunters && (
              <Badge variant="danger">Bug Hunter</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="mb-10 overflow-x-auto overflow-y-hidden border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-nowrap items-center gap-4">
          {TABS.map(({ key, label, icon: Icon }) => {
            const count =
              key === "bots"
                ? normalizedMe.user_bots.length + teamBots.length
                : key === "servers"
                  ? teamServers.length
                  : key === "packs"
                    ? normalizedMe.user_packs.length
                    : key === "templates"
                      ? myTemplates.length
                      : key === "themes"
                        ? myThemes.length
                        : key === "applications"
                          ? myApplications.length
                          : key === "teams"
                            ? normalizedMe.user_teams.length
                            : null;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={[
                  "relative -mb-px flex shrink-0 items-center gap-2 border-b-2 px-1 pb-4 pt-3 text-sm font-medium transition-colors",
                  tab === key
                    ? "border-accent text-accent"
                    : "border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50",
                ].join(" ")}
              >
                <Icon size={14} />
                {label}
                {count !== null && count > 0 && (
                  <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-800">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      {tab === "overview" && <OverviewTab me={normalizedMe} />}
      {tab === "profile" && (
        <EditProfileTab
          me={normalizedMe}
          token={session.token}
          mutate={mutate}
        />
      )}
      {tab === "bots" && (
        <BotsTab
          bots={normalizedMe.user_bots}
          teamBots={teamBots}
          token={session.token}
          userId={session.user_id}
          userTeams={normalizedMe.user_teams}
          mutate={mutate}
        />
      )}
      {tab === "servers" && (
        <ServersTab
          teamServers={teamServers}
          userId={session.user_id}
          token={session.token}
          mutate={mutate}
        />
      )}
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
      {tab === "applications" && <ApplicationsTab apps={myApplications} />}
      {tab === "teams" && <TeamsTab teams={normalizedMe.user_teams} />}
      {tab === "tokens" && (
        <div>
          <p className="mb-6 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
            Personal API tokens act as you across every endpoint. Bot- and
            server-scoped tokens can be managed from each listing&apos;s
            &quot;Tokens&quot; button on the Bots/Servers tabs.
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
    </Container>
  );
}
