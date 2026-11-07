"use client";

import { teams } from "@omniplex/core/api";
import type { PermissionData, Team } from "@omniplex/core/api/types";
import { hasPermString } from "@omniplex/core/permissions";
import { teamAvatarUrl } from "@omniplex/core/utils/assets";
import { Badge } from "@omniplex/ui/Badge";
import {
  Coins,
  FileText,
  LayoutDashboard,
  TriangleAlert,
  Users,
  Webhook as WebhookIcon,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { ManageShell, useSection } from "@/app/dashboard/manage/ManageShell";
import { Container } from "@/components/layout/Container";
import { Skeleton } from "@/components/ui/Skeleton";
import { VoteCreditsPanel } from "@/components/votes/VoteCreditsPanel";
import { WebhookManager } from "@/components/webhooks/WebhookManager";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { DangerSection } from "./DangerSection";
import { EditInfoSection } from "./EditInfoSection";
import { MembersSection } from "./MembersSection";
import { OverviewSection } from "./OverviewSection";

const SECTIONS = [
  "overview",
  "info",
  "members",
  "webhooks",
  "credits",
  "danger",
] as const;
type Section = (typeof SECTIONS)[number];

function SettingsSkeleton() {
  return (
    <Container className="py-10">
      <div className="grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    </Container>
  );
}

function TeamSettings() {
  const { session, loading: authLoading } = useRequireAuth();
  const params = useParams<{ id: string }>();
  const teamId = params.id;
  const [section, setSection] = useSection(SECTIONS, "overview");

  const [team, setTeam] = useState<Team | null>(null);
  const [catalog, setCatalog] = useState<PermissionData[]>([]);
  const [ownPerms, setOwnPerms] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [notMember, setNotMember] = useState(false);

  const load = useCallback(async () => {
    if (!session) return;
    try {
      const [teamRes, catalogRes, permsRes] = await Promise.all([
        teams.getTeam(teamId, session.token),
        teams.getPermissionCatalog(),
        teams.getEntityPerms(session.user_id, "team", teamId),
      ]);
      setTeam(teamRes);
      setCatalog(catalogRes.perms);
      setOwnPerms(permsRes.perms);
      setNotMember(permsRes.perms.length === 0);
    } catch {
      setNotMember(true);
    } finally {
      setLoading(false);
    }
  }, [session, teamId]);

  useEffect(() => {
    load();
  }, [load]);

  if (authLoading || loading) return <SettingsSkeleton />;

  if (notMember || !team || !session) {
    return (
      <Container className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          You don&apos;t have permission to manage this team.
        </p>
        <Link
          href={`/teams/${teamId}`}
          className="mt-3 text-sm text-accent underline underline-offset-2"
        >
          Back to team page
        </Link>
      </Container>
    );
  }

  const can = (perm: string) => hasPermString(ownPerms, perm);
  const allowed: Record<Section, boolean> = {
    overview: true,
    info: can("edit_team"),
    members: true,
    webhooks: can("manage_webhooks") || can("view_webhook_logs"),
    credits: true,
    danger: can("owner"),
  };
  const active = allowed[section] ? section : "overview";
  const members = team.entities?.members ?? [];

  const groups = [
    {
      label: "Team",
      items: [
        {
          key: "overview" as Section,
          label: "Overview",
          icon: LayoutDashboard,
        },
        { key: "info" as Section, label: "Profile", icon: FileText },
        {
          key: "members" as Section,
          label: "Members",
          icon: Users,
          count: members.length,
        },
      ],
    },
    {
      label: "Developers",
      items: [
        { key: "webhooks" as Section, label: "Webhooks", icon: WebhookIcon },
      ],
    },
    {
      label: "Billing",
      items: [
        { key: "credits" as Section, label: "Vote credits", icon: Coins },
      ],
    },
    {
      label: "Ownership",
      items: [
        {
          key: "danger" as Section,
          label: "Danger zone",
          icon: TriangleAlert,
        },
      ],
    },
  ]
    .map((g) => ({ ...g, items: g.items.filter((i) => allowed[i.key]) }))
    .filter((g) => g.items.length > 0);

  return (
    <ManageShell
      backHref="/dashboard?tab=teams"
      backLabel="Your teams"
      name={team.name}
      avatar={teamAvatarUrl(team.id, team.asset_versions?.avatar)}
      viewHref={`/teams/${team.vanity || team.id}`}
      badges={
        can("owner") ? (
          <Badge variant="info">Owner</Badge>
        ) : (
          <Badge>Member</Badge>
        )
      }
      groups={groups}
      active={active}
      onSelect={setSection}
    >
      {active === "overview" && (
        <OverviewSection
          team={team}
          ownPerms={ownPerms}
          token={session.token}
        />
      )}
      {active === "info" && (
        <EditInfoSection
          team={team}
          userId={session.user_id}
          token={session.token}
          onSaved={load}
        />
      )}
      {active === "members" && (
        <MembersSection
          team={team}
          catalog={catalog}
          ownPerms={ownPerms}
          currentUserId={session.user_id}
          token={session.token}
          onChanged={load}
        />
      )}
      {active === "webhooks" && (
        <WebhookManager
          targetType="team"
          targetId={team.id}
          authToken={session.token}
          canManage={can("manage_webhooks")}
          canViewLogs={can("view_webhook_logs")}
        />
      )}
      {active === "credits" && (
        <VoteCreditsPanel
          targetType="team"
          targetId={team.id}
          token={session.token}
          canRedeem={can("redeem_vote_credits")}
        />
      )}
      {active === "danger" && (
        <DangerSection team={team} token={session.token} />
      )}
    </ManageShell>
  );
}

export default function TeamSettingsPage() {
  return (
    <Suspense>
      <TeamSettings />
    </Suspense>
  );
}
