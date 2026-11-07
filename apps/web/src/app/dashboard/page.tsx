"use client";

import type { User as UserType } from "@omniplex/core/api/types";
import { hasPermString } from "@omniplex/core/permissions";
import { mirroredAvatarUrl } from "@omniplex/core/utils/assets";
import { Avatar } from "@omniplex/ui/Avatar";
import {
  ArrowUpRight,
  Bell,
  Bot,
  ClipboardList,
  KeyRound,
  LayoutDashboard,
  LayoutTemplate,
  Package,
  Palette,
  Repeat,
  Server as ServerIcon,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { TokenManager } from "@/components/sessions/TokenManager";
import { Skeleton } from "@/components/ui/Skeleton";
import { useMyApplications } from "@/hooks/useApplications";
import { useAuth } from "@/hooks/useAuth";
import { useMe } from "@/hooks/useMe";
import { useMyTemplates } from "@/hooks/useTemplates";
import { useMyThemes } from "@/hooks/useThemes";
import { ApplicationsTab } from "./ApplicationsTab";
import { AutoVoteTab } from "./AutoVoteTab";
import { BotsTab, type TeamBot } from "./BotsTab";
import { DashboardNav } from "./DashboardNav";
import { NotificationsTab } from "./NotificationsTab";
import { OverviewPanel } from "./OverviewPanel";
import { PacksTab } from "./PacksTab";
import { EditProfileTab } from "./ProfileTab";
import { SecurityTab } from "./SecurityTab";
import { ServersTab, type TeamServer } from "./ServersTab";
import { TeamsTab } from "./TeamsTab";
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
