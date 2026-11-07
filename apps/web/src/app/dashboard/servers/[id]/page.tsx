"use client";

import { servers } from "@omniplex/core/api";
import { mirroredAvatarUrl, serverPath } from "@omniplex/core/utils/assets";
import { formatCount } from "@omniplex/core/utils/format";
import { Badge } from "@omniplex/ui/Badge";
import {
  BarChart2,
  FileText,
  Heart,
  Image as ImageIcon,
  KeyRound,
  Megaphone,
  Sparkles,
  TriangleAlert,
  Users,
  Webhook as WebhookIcon,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";
import useSWR from "swr";
import { BotChangelogSection } from "@/components/bots/BotChangelogSection";
import { Container } from "@/components/layout/Container";
import { TokenManager } from "@/components/sessions/TokenManager";
import { WebhookManager } from "@/components/webhooks/WebhookManager";
import { useAuth } from "@/hooks/useAuth";
import { useEntityPermission } from "@/hooks/useEntityPermission";
import { AnalyticsPanel } from "../../manage/AnalyticsPanel";
import {
  ManageShell,
  SettingsCard,
  StatGrid,
  useSection,
} from "../../manage/ManageShell";
import { AppearanceSection } from "./AppearanceSection";
import { DangerSection } from "./DangerSection";
import { DetailsSection, type SectionProps } from "./DetailsSection";
import { VoteMessagesSection } from "./VoteMessagesSection";

const SECTIONS = [
  "details",
  "appearance",
  "stats",
  "changelog",
  "votes",
  "sessions",
  "webhooks",
  "team",
  "danger",
] as const;
type Section = (typeof SECTIONS)[number];

function ServerSettings() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { session, isAuthenticated, loading: authLoading } = useAuth();
  const [section, setSection] = useSection(SECTIONS, "details");
  const {
    perms,
    hasPerm,
    loading: permsLoading,
  } = useEntityPermission("server", params.id);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace("/auth/login");
  }, [authLoading, isAuthenticated, router]);

  const token = session?.token;
  const {
    data: server,
    error,
    mutate,
  } = useSWR(token ? ["manage/server", params.id] : null, () =>
    servers.getServer(params.id, token),
  );

  const { data: changelogs } = useSWR(
    token && section === "changelog"
      ? ["manage/server/changelogs", params.id]
      : null,
    () => servers.getChangelogs(params.id, token),
  );

  if (error) {
    return (
      <Container className="py-24 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Couldn&apos;t load this server.{" "}
        <Link
          href="/dashboard?tab=servers"
          className="text-accent hover:underline"
        >
          Back to your servers
        </Link>
      </Container>
    );
  }
  if (!session || !server || permsLoading) {
    return (
      <Container className="py-24 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Loading…
      </Container>
    );
  }
  if (!hasPerm("edit_servers")) {
    return (
      <Container className="py-24 text-center text-sm text-zinc-500 dark:text-zinc-400">
        You don&apos;t have permission to manage this server.{" "}
        <Link
          href={serverPath(server.server_id, server.vanity)}
          className="text-accent hover:underline"
        >
          View its page
        </Link>
      </Container>
    );
  }

  const props: SectionProps = {
    server,
    userId: session.user_id,
    token: session.token,
    onSaved: () => mutate(),
  };
  const isLive = server.type === "approved" || server.type === "certified";
  const canDelete = hasPerm("delete_servers");

  const groups = [
    {
      label: "Listing",
      items: [
        { key: "details" as Section, label: "Details", icon: FileText },
        { key: "appearance" as Section, label: "Appearance", icon: ImageIcon },
        { key: "stats" as Section, label: "Statistics", icon: BarChart2 },
        { key: "changelog" as Section, label: "Updates", icon: Megaphone },
        { key: "votes" as Section, label: "Vote messages", icon: Heart },
      ],
    },
    {
      label: "Developers",
      items: [
        { key: "sessions" as Section, label: "API sessions", icon: KeyRound },
        { key: "webhooks" as Section, label: "Webhooks", icon: WebhookIcon },
      ],
    },
    {
      label: "Ownership",
      items: [
        { key: "team" as Section, label: "Team", icon: Users },
        ...(canDelete
          ? [
              {
                key: "danger" as Section,
                label: "Danger zone",
                icon: TriangleAlert,
              },
            ]
          : []),
      ],
    },
  ];

  return (
    <ManageShell
      backHref="/dashboard?tab=servers"
      backLabel="Your servers"
      name={server.name}
      avatar={mirroredAvatarUrl("servers", server.server_id, server.avatar)}
      viewHref={serverPath(server.server_id, server.vanity)}
      badges={
        <>
          {server.type === "certified" && (
            <Badge variant="success">Certified</Badge>
          )}
          {server.premium && <Badge variant="premium">Premium</Badge>}
          {!isLive && (
            <Badge variant={server.type === "denied" ? "danger" : "warning"}>
              {server.type === "denied" ? "Denied" : "In review"}
            </Badge>
          )}
          {isLive && !server.premium && (
            <Link
              href={`/shop/premium?server=${server.server_id}`}
              className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent hover:bg-accent/15"
            >
              <Sparkles size={11} />
              Upgrade
            </Link>
          )}
        </>
      }
      groups={groups}
      active={section}
      onSelect={setSection}
    >
      {section === "details" && <DetailsSection {...props} />}
      {section === "appearance" && <AppearanceSection {...props} />}
      {section === "stats" && (
        <StatGrid
          stats={[
            { label: "Members", value: formatCount(server.total_members) },
            { label: "Online now", value: formatCount(server.online_members) },
            { label: "Votes this month", value: formatCount(server.votes) },
            {
              label: "Automatic votes",
              value: formatCount(server.auto_votes ?? 0),
            },
            { label: "Page views", value: formatCount(server.clicks) },
            {
              label: "Unique page views",
              value: formatCount(server.unique_clicks),
            },
            {
              label: "Invite clicks",
              value: formatCount(server.invite_clicks),
            },
          ]}
        />
      )}
      {section === "stats" && (
        <AnalyticsPanel
          kind="server"
          id={server.server_id}
          token={session.token}
        />
      )}
      {section === "sessions" && (
        <TokenManager
          targetType="server"
          targetId={server.server_id}
          authToken={session.token}
          myPerms={perms}
        />
      )}
      {section === "changelog" &&
        (changelogs ? (
          <BotChangelogSection
            entityId={server.server_id}
            kind="server"
            initialChangelogs={changelogs.changelogs}
            canEdit
            token={session.token}
          />
        ) : (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
        ))}
      {section === "votes" && (
        <VoteMessagesSection
          serverId={server.server_id}
          token={session.token}
        />
      )}
      {section === "webhooks" && (
        <WebhookManager
          targetType="server"
          targetId={server.server_id}
          authToken={session.token}
          canManage={hasPerm("manage_webhooks")}
          canViewLogs={hasPerm("view_webhook_logs")}
        />
      )}
      {section === "team" && (
        <SettingsCard
          title="Owning team"
          description="Servers always belong to a team. Manage who can edit this server, and what they can do, in the team's settings."
        >
          {server.team_owner ? (
            <div className="flex flex-wrap gap-4 text-sm">
              <Link
                href={`/teams/${server.team_owner.id}`}
                className="font-medium text-accent hover:underline"
              >
                {server.team_owner.name}
              </Link>
              <Link
                href={`/teams/${server.team_owner.id}/settings`}
                className="text-zinc-500 hover:text-accent dark:text-zinc-400"
              >
                Team settings
              </Link>
            </div>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No owning team found.
            </p>
          )}
        </SettingsCard>
      )}
      {section === "danger" && canDelete && <DangerSection {...props} />}
    </ManageShell>
  );
}

export default function ServerSettingsPage() {
  return (
    <Suspense>
      <ServerSettings />
    </Suspense>
  );
}
