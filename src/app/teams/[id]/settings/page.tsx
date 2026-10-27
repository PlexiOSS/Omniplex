"use client";

import {
  ArrowUpRight,
  Bot,
  Coins,
  FileText,
  LayoutDashboard,
  Pencil,
  Plus,
  Server,
  TriangleAlert,
  Upload,
  UserMinus,
  Users,
  Webhook as WebhookIcon,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import {
  FormMessage,
  ManageShell,
  SettingsCard,
  StatGrid,
  TextArea,
  Toggle,
  useSection,
} from "@/app/dashboard/manage/ManageShell";
import { Container } from "@/components/layout/Container";
import { PermSelector } from "@/components/teams/PermSelector";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { VoteCreditsPanel } from "@/components/votes/VoteCreditsPanel";
import { WebhookManager } from "@/components/webhooks/WebhookManager";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { reviews, teams, votes, webhooks } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import type { PermissionData, Team, TeamMember } from "@/lib/api/types";
import { hasPermString } from "@/lib/permissions";
import {
  bannerUrl,
  mirroredAvatarUrl,
  teamAvatarUrl,
} from "@/lib/utils/assets";
import { formatCount, formatCountLabel } from "@/lib/utils/format";
import { UploadError, uploadAsset } from "@/lib/utils/upload";

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

function OverviewSection({
  team,
  ownPerms,
  token,
}: {
  team: Team;
  ownPerms: string[];
  token: string;
}) {
  const [reviewStats, setReviewStats] = useState<{
    count: number;
    avgStars: number;
  } | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [webhookStats, setWebhookStats] = useState<{
    configured: number;
    deliveries: number;
  } | null>(null);

  const canViewWebhookActivity =
    hasPermString(ownPerms, "manage_webhooks") ||
    hasPermString(ownPerms, "view_webhook_logs");

  useEffect(() => {
    reviews
      .getAll("team", team.id)
      .then((res) => {
        const stars = res.reviews.map((r) => r.stars);
        setReviewStats({
          count: stars.length,
          avgStars:
            stars.length > 0
              ? stars.reduce((a, b) => a + b, 0) / stars.length
              : 0,
        });
      })
      .catch(() => setReviewStats({ count: 0, avgStars: 0 }));

    votes
      .getRedeemLogs("team", team.id)
      .then((res) => setCredits(res.available_credits))
      .catch(() => setCredits(null));
  }, [team.id]);

  useEffect(() => {
    if (!canViewWebhookActivity) return;
    Promise.all([
      webhooks.list("team", team.id, token),
      webhooks.getLogs("team", team.id, 1, token),
    ])
      .then(([list, logs]) => {
        setWebhookStats({ configured: list.length, deliveries: logs.count });
      })
      .catch(() => setWebhookStats(null));
  }, [canViewWebhookActivity, team.id, token]);

  const members = team.entities?.members ?? [];
  const bots = team.entities?.bots ?? [];
  const servers = team.entities?.servers ?? [];
  const canEditBots = hasPermString(ownPerms, "edit_bots");
  const canEditServers = hasPermString(ownPerms, "edit_servers");

  const listings = [
    ...bots.map((b) => ({
      key: `bot-${b.bot_id}`,
      kind: "Bot" as const,
      name: b.user.username,
      avatar: mirroredAvatarUrl("bots", b.bot_id, b.user.avatar),
      viewHref: `/bots/${b.vanity || b.bot_id}`,
      manageHref: canEditBots ? `/dashboard/bots/${b.bot_id}` : null,
    })),
    ...servers.map((s) => ({
      key: `server-${s.server_id}`,
      kind: "Server" as const,
      name: s.name,
      avatar: mirroredAvatarUrl("servers", s.server_id, s.avatar),
      viewHref: `/servers/${s.vanity || s.server_id}`,
      manageHref: canEditServers ? `/dashboard/servers/${s.server_id}` : null,
    })),
  ];

  return (
    <div className="space-y-6">
      <StatGrid
        stats={[
          { label: "Votes", value: formatCount(team.votes) },
          { label: "Members", value: formatCount(members.length) },
          { label: "Bots", value: formatCount(bots.length) },
          { label: "Servers", value: formatCount(servers.length) },
          {
            label: "Reviews",
            value: reviewStats
              ? reviewStats.count > 0
                ? `${reviewStats.count} (${reviewStats.avgStars.toFixed(1)}★)`
                : "0"
              : "…",
          },
          {
            label: "Vote credits",
            value: credits !== null ? (credits / 100).toFixed(2) : "…",
          },
        ]}
      />

      <SettingsCard
        title="Listings"
        description="Bots and servers this team owns."
      >
        {listings.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            This team doesn&apos;t own any listings yet.
          </p>
        ) : (
          <ul className="-my-2 divide-y divide-zinc-100 dark:divide-zinc-800">
            {listings.map((l) => (
              <li key={l.key} className="flex items-center gap-3 py-2.5">
                <Avatar src={l.avatar} alt={l.name} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                    {l.name}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {l.kind === "Bot" ? (
                      <Bot size={11} />
                    ) : (
                      <Server size={11} />
                    )}
                    {l.kind}
                  </p>
                </div>
                <Link
                  href={l.viewHref}
                  className="inline-flex items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                >
                  View <ArrowUpRight size={11} />
                </Link>
                {l.manageHref && (
                  <Link
                    href={l.manageHref}
                    className="text-xs font-medium text-accent hover:underline"
                  >
                    Manage
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </SettingsCard>

      {canViewWebhookActivity && (
        <SettingsCard
          title="Webhook activity"
          description={
            webhookStats
              ? `${formatCountLabel(webhookStats.configured, "webhook")} configured, ${formatCountLabel(webhookStats.deliveries, "delivery", "deliveries")} logged.`
              : "Loading…"
          }
        />
      )}
    </div>
  );
}

function EditInfoSection({
  team,
  userId,
  token,
  onSaved,
}: {
  team: Team;
  userId: string;
  token: string;
  onSaved: () => void;
}) {
  const [name, setName] = useState(team.name);
  const [short, setShort] = useState(team.short ?? "");
  const [tags, setTags] = useState((team.tags ?? []).join(", "));
  const [nsfw, setNsfw] = useState(team.nsfw);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [avatarVersion, setAvatarVersion] = useState<string | null>(
    team.asset_versions?.avatar ?? null,
  );
  const [bannerVersion, setBannerVersion] = useState<string | null>(
    team.asset_versions?.banner ?? null,
  );
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  async function handleImageUpload(
    kind: "team-avatar" | "team-banner",
    file: File,
  ) {
    const setUploading =
      kind === "team-avatar" ? setUploadingAvatar : setUploadingBanner;
    const setVersion =
      kind === "team-avatar" ? setAvatarVersion : setBannerVersion;
    setUploading(true);
    setImageError(null);
    try {
      setVersion(await uploadAsset(kind, team.id, file, { userId, token }));
    } catch (err) {
      setImageError(
        err instanceof UploadError ? err.message : "Upload failed.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await teams.updateTeam(
        team.id,
        {
          name: name.trim(),
          short: short.trim() || undefined,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          nsfw,
        },
        token,
      );
      onSaved();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <SettingsCard
        title="Images"
        description="WebP, PNG, JPEG, or GIF, 5MB max."
        footer={imageError ? <FormMessage error={imageError} /> : undefined}
      >
        <div>
          <Banner
            src={bannerUrl("teams", team.id, bannerVersion)}
            alt={team.name}
            className="h-32 rounded-xl sm:h-40"
          />
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/webp,image/png,image/jpeg,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) handleImageUpload("team-banner", file);
            }}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            loading={uploadingBanner}
            onClick={() => bannerInputRef.current?.click()}
            className="mt-2"
          >
            <Upload size={14} />
            {bannerVersion ? "Replace banner" : "Upload banner"}
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <Avatar
            src={teamAvatarUrl(team.id, avatarVersion)}
            alt={team.name}
            size={56}
          />
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/webp,image/png,image/jpeg,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) handleImageUpload("team-avatar", file);
            }}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            loading={uploadingAvatar}
            onClick={() => avatarInputRef.current?.click()}
          >
            <Upload size={14} />
            {avatarVersion ? "Replace avatar" : "Upload avatar"}
          </Button>
        </div>
      </SettingsCard>

      <form onSubmit={handleSave}>
        <SettingsCard
          title="Profile"
          description="How your team appears on its public page."
          footer={
            <>
              <FormMessage error={error} success={saved ? "Saved." : null} />
              <Button type="submit" variant="primary" loading={saving}>
                Save changes
              </Button>
            </>
          }
        >
          <Input
            id="team-name"
            label="Team name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <TextArea
            id="team-short"
            label="Short description"
            rows={2}
            maxLength={150}
            value={short}
            onChange={setShort}
          />
          <Input
            id="team-tags"
            label="Tags"
            placeholder="comma, separated, tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
          <Toggle checked={nsfw} onChange={setNsfw} label="This team is NSFW" />
        </SettingsCard>
      </form>
    </div>
  );
}

function MembersSection({
  team,
  catalog,
  ownPerms,
  currentUserId,
  token,
  onChanged,
}: {
  team: Team;
  catalog: PermissionData[];
  ownPerms: string[];
  currentUserId: string;
  token: string;
  onChanged: () => void;
}) {
  const members = team.entities?.members ?? [];
  const canAdd = hasPermString(ownPerms, "add_team_members");
  const canEdit = hasPermString(ownPerms, "edit_team_members");
  const canDelete = hasPermString(ownPerms, "remove_team_members");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [newUserId, setNewUserId] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newUserId.trim()) return;
    setAdding(true);
    setAddError(null);
    try {
      await teams.addMember(
        team.id,
        { user_id: newUserId.trim(), perms: [] },
        token,
      );
      setNewUserId("");
      onChanged();
    } catch (err) {
      setAddError(
        err instanceof ApiError ? err.message : "Failed to add member.",
      );
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="space-y-6">
      {canAdd && (
        <form onSubmit={handleAdd}>
          <SettingsCard
            title="Add a member"
            description="New members start with no permissions. Grant them below once they're added."
            footer={
              <>
                <FormMessage error={addError} />
                <Button type="submit" variant="primary" loading={adding}>
                  <Plus size={14} />
                  Add member
                </Button>
              </>
            }
          >
            <Input
              id="new-member-id"
              label="Discord user ID"
              placeholder="123456789012345678"
              value={newUserId}
              onChange={(e) => setNewUserId(e.target.value)}
            />
          </SettingsCard>
        </form>
      )}

      <SettingsCard
        title="Members"
        description={formatCountLabel(members.length, "member")}
      >
        <ul className="-my-2 divide-y divide-zinc-100 dark:divide-zinc-800">
          {members.map((member) => {
            const memberId = member.user?.id ?? "";
            const isOwner = hasPermString(member.flags, "owner");
            const isSelf = memberId === currentUserId;
            const editing = editingId === member.itag;
            return (
              <li key={member.itag} className="py-3">
                <div className="flex flex-wrap items-center gap-3">
                  <Avatar
                    src={member.user?.avatar ?? ""}
                    alt={member.user?.username ?? "Unknown"}
                    size={36}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                      {member.user?.display_name ||
                        member.user?.username ||
                        "Unknown"}
                      {isSelf && (
                        <span className="ml-1.5 text-xs font-normal text-zinc-400">
                          (you)
                        </span>
                      )}
                    </p>
                    <div className="mt-0.5 flex min-w-0 flex-wrap gap-1">
                      {isOwner ? (
                        <Badge variant="info">Owner</Badge>
                      ) : member.flags.length === 0 ? (
                        <span className="text-xs text-zinc-400">
                          No permissions
                        </span>
                      ) : (
                        member.flags.map((flag) => (
                          <Badge key={flag}>{flag}</Badge>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setEditingId(editing ? null : member.itag)
                        }
                        className="h-7 px-2 text-xs"
                      >
                        <Pencil size={12} />
                        {editing ? "Close" : "Permissions"}
                      </Button>
                    )}
                    {(canDelete || isSelf) && (
                      <RemoveMemberButton
                        teamId={team.id}
                        userId={memberId}
                        label={isSelf ? "Leave" : "Remove"}
                        token={token}
                        onRemoved={onChanged}
                      />
                    )}
                  </div>
                </div>
                {editing && (
                  <MemberPermsEditor
                    teamId={team.id}
                    member={member}
                    catalog={catalog}
                    ownPerms={ownPerms}
                    token={token}
                    onCancel={() => setEditingId(null)}
                    onSaved={() => {
                      setEditingId(null);
                      onChanged();
                    }}
                  />
                )}
              </li>
            );
          })}
        </ul>
      </SettingsCard>
    </div>
  );
}

function RemoveMemberButton({
  teamId,
  userId,
  label,
  token,
  onRemoved,
}: {
  teamId: string;
  userId: string;
  label: string;
  token: string;
  onRemoved: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);
  const confirmRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleClick() {
    if (!confirming) {
      setConfirming(true);
      confirmRef.current = setTimeout(() => setConfirming(false), 3000);
      return;
    }
    if (confirmRef.current) clearTimeout(confirmRef.current);
    setConfirming(false);
    setRemoving(true);
    teams
      .removeMember(teamId, userId, token)
      .then(onRemoved)
      .catch(() => setRemoving(false));
  }

  return (
    <Button
      variant={confirming ? "danger" : "ghost"}
      size="sm"
      loading={removing}
      onClick={handleClick}
      className="h-7 px-2 text-xs"
    >
      <UserMinus size={12} />
      {confirming ? "Confirm?" : label}
    </Button>
  );
}

function MemberPermsEditor({
  teamId,
  member,
  catalog,
  ownPerms,
  token,
  onCancel,
  onSaved,
}: {
  teamId: string;
  member: TeamMember;
  catalog: PermissionData[];
  ownPerms: string[];
  token: string;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [perms, setPerms] = useState<string[]>(member.flags);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await teams.updateMember(teamId, member.user?.id ?? "", { perms }, token);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-3 rounded-2xl border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
      <PermSelector
        catalog={catalog}
        granterPerms={ownPerms}
        value={perms}
        onChange={setPerms}
      />
      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        <FormMessage error={error} />
        <Button variant="secondary" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          loading={saving}
          onClick={handleSave}
        >
          Save permissions
        </Button>
      </div>
    </div>
  );
}

function DangerSection({ team, token }: { team: Team; token: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove(e: React.FormEvent) {
    e.preventDefault();
    if (confirm !== team.name) return;
    setDeleting(true);
    setError(null);
    try {
      await teams.deleteTeam(team.id, token);
      router.push("/dashboard?tab=teams");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to delete the team.",
      );
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={remove}>
      <SettingsCard
        tone="danger"
        title="Delete this team"
        description={`Permanently deletes ${team.name}. Bots and servers owned by this team will be affected. This can't be undone.`}
        footer={
          <>
            <FormMessage error={error} />
            <Button
              type="submit"
              variant="danger"
              loading={deleting}
              disabled={confirm !== team.name}
            >
              Delete team
            </Button>
          </>
        }
      >
        <Input
          id="delete-confirm"
          label={`Type ${team.name} to confirm`}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </SettingsCard>
    </form>
  );
}
