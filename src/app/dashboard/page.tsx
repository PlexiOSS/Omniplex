"use client";

import {
  ArrowUpRight,
  Bot,
  GitBranch,
  Globe,
  LayoutDashboard,
  Package,
  Pencil,
  Plus,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Container } from "@/components/layout/Container";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useMe } from "@/hooks/useMe";
import { bots, users } from "@/lib/api";
import type {
  Link as ApiLink,
  BotType,
  IndexBot,
  Team,
  User as UserType,
} from "@/lib/api/types";
import { hasAnyPermString } from "@/lib/permissions";
import { resolveAsset } from "@/lib/utils/assets";
import { formatCount } from "@/lib/utils/format";
import { BotEditModal } from "./BotEditModal";
import { PacksTab } from "./PacksTab";

type Tab = "overview" | "profile" | "bots" | "packs" | "teams";

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
          { label: "Bots", value: me.user_bots.length },
          { label: "Packs", value: me.user_packs.length },
          { label: "Teams", value: me.user_teams.length },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="p-4 border rounded-xl border-zinc-200 dark:border-zinc-800"
          >
            <p className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
              {value}
            </p>
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
              {label}
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

const MAX_PROFILE_LINKS = 20;

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

  function updateLink(index: number, patch: Partial<ApiLink>) {
    setLinks((prev) =>
      prev.map((link, i) => (i === index ? { ...link, ...patch } : link)),
    );
  }

  function removeLink(index: number) {
    setLinks((prev) => prev.filter((_, i) => i !== index));
  }

  function addLink() {
    setLinks((prev) =>
      prev.length >= MAX_PROFILE_LINKS
        ? prev
        : [...prev, { name: "", value: "" }],
    );
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
    <div className="max-w-lg space-y-5">
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
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Links
          </p>
          <span className="text-xs text-zinc-400">
            {links.length}/{MAX_PROFILE_LINKS}
          </span>
        </div>

        <div className="space-y-2">
          {links.map((link, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: rows have no stable id until saved
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                value={link.name}
                onChange={(e) => updateLink(index, { name: e.target.value })}
                placeholder="Name (e.g. website, github)"
                className="w-36 shrink-0 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 placeholder:text-zinc-400 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600"
              />
              <input
                type="url"
                value={link.value}
                onChange={(e) => updateLink(index, { value: e.target.value })}
                placeholder="https://…"
                className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 placeholder:text-zinc-400 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600"
              />
              <button
                type="button"
                onClick={() => removeLink(index)}
                aria-label="Remove link"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-red-600 dark:hover:bg-zinc-800 dark:hover:text-red-400"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>

        {links.length < MAX_PROFILE_LINKS && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addLink}
            className="mt-2"
          >
            <Plus size={14} />
            Add link
          </Button>
        )}
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
  onDeleted,
  mutate,
  team,
  canManage = true,
}: {
  bot: IndexBot;
  token: string;
  onDeleted: (id: string) => void;
  mutate: () => void;
  /** Set when this bot is owned by a team the user is a member of, rather than owned directly. */
  team?: Team;
  /** Whether the current user has permission to edit/delete this bot. Always true for directly-owned bots. */
  canManage?: boolean;
}) {
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [editing, setEditing] = useState(false);
  const confirmRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      .then(() => onDeleted(bot.bot_id))
      .catch(() => setDeleting(false));
  }

  return (
    <div className="flex flex-col p-4 bg-white border rounded-xl border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start gap-3">
        <Avatar src={bot.user.avatar} alt={bot.user.username} size={44} />
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
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditing(true)}
                className="px-2 text-xs h-7"
              >
                <Pencil size={12} />
                Edit
              </Button>
              <Button
                variant={confirming ? "danger" : "ghost"}
                size="sm"
                loading={deleting}
                onClick={handleDeleteClick}
                className="px-2 text-xs h-7"
              >
                <Trash2 size={12} />
                {confirming ? "Confirm?" : "Delete"}
              </Button>
            </>
          )}
        </div>
      </div>

      {editing && (
        <BotEditModal
          botId={bot.bot_id}
          token={token}
          onClose={() => setEditing(false)}
          onSaved={mutate}
        />
      )}
    </div>
  );
}

interface TeamBot {
  bot: IndexBot;
  team: Team;
  canManage: boolean;
}

function BotsTab({
  bots: allBots,
  teamBots: allTeamBots,
  token,
  mutate,
}: {
  bots: IndexBot[];
  teamBots: TeamBot[];
  token: string;
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
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
          {botList.length} {botList.length === 1 ? "bot" : "bots"}
        </p>
        {botList.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {botList.map((bot) => (
              <BotItem
                key={bot.bot_id}
                bot={bot}
                token={token}
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
            {teamBotList.map(({ bot, team, canManage }) => (
              <BotItem
                key={bot.bot_id}
                bot={bot}
                token={token}
                mutate={mutate}
                onDeleted={handleDeleted}
                team={team}
                canManage={canManage}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TeamItem({ team }: { team: Team }) {
  const avatarSrc = resolveAsset(team.avatar) ?? "";
  return (
    <Link
      href={`/teams/${team.id}`}
      className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
    >
      <Avatar src={avatarSrc} alt={team.name} size={44} />
      <div className="flex-1 min-w-0">
        <span className="block font-semibold truncate text-zinc-950 dark:text-zinc-50">
          {team.name}
        </span>
        {team.short && (
          <p className="mt-0.5 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
            {team.short}
          </p>
        )}
      </div>
    </Link>
  );
}

function TeamsTab({ teams }: { teams: Team[] }) {
  return (
    <div>
      <div className="mb-6">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {teams.length} {teams.length === 1 ? "team" : "teams"}
        </p>
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
            <TeamItem key={team.id} team={team} />
          ))}
        </div>
      )}
    </div>
  );
}

// Best-effort client-side gate for whether to show manage actions (edit/delete)
// on a team-owned bot — the actual PATCH/DELETE endpoints independently
// re-check permissions server-side via kittycat regardless, so getting this
// heuristic slightly wrong only affects which buttons are shown, not security.
const BOT_MANAGE_FLAGS = ["*", "global.*", "bot.*", "bot.edit"];
function canManageTeamBot(flags: string[]): boolean {
  return flags.some((f) => BOT_MANAGE_FLAGS.includes(f));
}

const TABS: { key: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "profile", label: "Edit Profile", icon: User },
  { key: "bots", label: "Bots", icon: Bot },
  { key: "packs", label: "Packs", icon: Package },
  { key: "teams", label: "Teams", icon: Users },
];

export default function DashboardPage() {
  const { session, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [authLoading, isAuthenticated, router]);

  const { me, loading: meLoading, mutate } = useMe(session);

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
    const canManage = hasAnyPermString(myFlags, [
      "global.*",
      "bot.*",
      "bot.edit",
    ]);
    return (team.entities?.bots ?? []).map((bot) => ({
      bot,
      team,
      canManage,
    }));
  });

  return (
    <Container className="py-10">
      {/* Profile header */}
      <div className="flex items-start gap-4 mb-8">
        <Avatar src={avatar} alt={username} size={64} />
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
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="mb-8 overflow-x-auto border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-1">
          {TABS.map(({ key, label, icon: Icon }) => {
            const count =
              key === "bots"
                ? normalizedMe.user_bots.length + teamBots.length
                : key === "packs"
                  ? normalizedMe.user_packs.length
                  : key === "teams"
                    ? normalizedMe.user_teams.length
                    : null;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={[
                  "relative -mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 pb-3 pt-1 text-sm font-medium transition-colors",
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
      {tab === "teams" && <TeamsTab teams={normalizedMe.user_teams} />}
    </Container>
  );
}
