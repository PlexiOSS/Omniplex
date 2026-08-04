"use client";

import { ArrowLeft, Pencil, Plus, Trash2, UserMinus } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Container } from "@/components/layout/Container";
import { PermSelector } from "@/components/teams/PermSelector";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { teams } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import type { PermissionData, Team, TeamMember } from "@/lib/api/types";
import { hasPermString } from "@/lib/permissions";

type Tab = "overview" | "info" | "members" | "danger";

function SettingsSkeleton() {
  return (
    <Container className="py-10">
      <div className="max-w-2xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    </Container>
  );
}

export default function TeamSettingsPage() {
  const { session, loading: authLoading } = useRequireAuth();
  const params = useParams<{ id: string }>();
  const teamId = params.id;

  const [team, setTeam] = useState<Team | null>(null);
  const [catalog, setCatalog] = useState<PermissionData[]>([]);
  const [ownPerms, setOwnPerms] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [notMember, setNotMember] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");

  const load = useCallback(async () => {
    if (!session) return;
    try {
      const [teamRes, catalogRes, permsRes] = await Promise.all([
        teams.getTeam(teamId),
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

  if (notMember || !team) {
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

  const TABS: { key: Tab; label: string; perm?: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "info", label: "Edit Info", perm: "edit_team" },
    { key: "members", label: "Members" },
    { key: "danger", label: "Danger Zone", perm: "owner" },
  ];
  const visibleTabs = TABS.filter(
    (t) => !t.perm || hasPermString(ownPerms, t.perm),
  );

  return (
    <Container className="py-10">
      <Link
        href={`/teams/${teamId}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        <ArrowLeft size={14} />
        {team.name}
      </Link>

      <h1 className="mb-8 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
        Team Settings
      </h1>

      <div className="mb-8 overflow-x-auto border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-1">
          {visibleTabs.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={[
                "relative -mb-px shrink-0 border-b-2 px-3 pb-3 pt-1 text-sm font-medium transition-colors",
                tab === key
                  ? "border-accent text-accent"
                  : "border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === "overview" && <OverviewTab team={team} />}
      {tab === "info" && session && (
        <EditInfoTab team={team} token={session.token} onSaved={load} />
      )}
      {tab === "members" && session && (
        <MembersTab
          team={team}
          catalog={catalog}
          ownPerms={ownPerms}
          currentUserId={session.user_id}
          token={session.token}
          onChanged={load}
        />
      )}
      {tab === "danger" && session && (
        <DangerTab team={team} token={session.token} />
      )}
    </Container>
  );
}

function OverviewTab({ team }: { team: Team }) {
  return (
    <div className="max-w-lg space-y-4">
      <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Manage {team.name}&apos;s info, members, and permissions from here.
          Only actions you have permission for are shown.
        </p>
      </div>
    </div>
  );
}

function EditInfoTab({
  team,
  token,
  onSaved,
}: {
  team: Team;
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

  async function handleSave() {
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
    <div className="max-w-lg space-y-5">
      <Input
        id="team-name"
        label="Team Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="team-short"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Short Description
        </label>
        <textarea
          id="team-short"
          rows={2}
          maxLength={150}
          value={short}
          onChange={(e) => setShort(e.target.value)}
          className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
        />
      </div>

      <Input
        id="team-tags"
        label="Tags"
        placeholder="comma, separated, tags"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
      />

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={nsfw}
          onChange={(e) => setNsfw(e.target.checked)}
          className="h-4 w-4 rounded border-zinc-300 accent-accent dark:border-zinc-700"
        />
        <span className="text-sm text-zinc-700 dark:text-zinc-300">
          This team is NSFW
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

function MembersTab({
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

  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [addingOpen, setAddingOpen] = useState(false);
  const [newUserId, setNewUserId] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  async function handleAdd() {
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
      setAddingOpen(false);
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
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {members.length} {members.length === 1 ? "member" : "members"}
        </p>
        {canAdd && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setAddingOpen((o) => !o)}
          >
            <Plus size={14} />
            Add Member
          </Button>
        )}
      </div>

      {addingOpen && (
        <div className="mb-6 flex items-start gap-2 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <div className="flex-1">
            <Input
              id="new-member-id"
              label="Discord User ID"
              placeholder="123456789012345678"
              value={newUserId}
              onChange={(e) => setNewUserId(e.target.value)}
            />
            {addError && (
              <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
                {addError}
              </p>
            )}
          </div>
          <Button
            variant="primary"
            loading={adding}
            onClick={handleAdd}
            className="mt-6"
          >
            Add
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {members.map((member) => {
          const isOwner = hasPermString(member.flags, "owner");
          const isSelf = member.user?.id === currentUserId;
          return (
            <div
              key={member.itag}
              className="flex items-center gap-3 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800"
            >
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
                </p>
                <div className="mt-0.5 flex flex-wrap gap-1">
                  {isOwner ? (
                    <Badge variant="info">Owner</Badge>
                  ) : (
                    member.flags.map((flag) => <Badge key={flag}>{flag}</Badge>)
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingMember(member)}
                    className="h-7 px-2 text-xs"
                  >
                    <Pencil size={12} />
                    Permissions
                  </Button>
                )}
                {(canDelete || isSelf) && (
                  <RemoveMemberButton
                    teamId={team.id}
                    userId={member.user?.id ?? ""}
                    token={token}
                    onRemoved={onChanged}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {editingMember && (
        <EditMemberPermsModal
          teamId={team.id}
          member={editingMember}
          catalog={catalog}
          ownPerms={ownPerms}
          token={token}
          onClose={() => setEditingMember(null)}
          onSaved={() => {
            setEditingMember(null);
            onChanged();
          }}
        />
      )}
    </div>
  );
}

function RemoveMemberButton({
  teamId,
  userId,
  token,
  onRemoved,
}: {
  teamId: string;
  userId: string;
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
      {confirming ? "Confirm?" : "Remove"}
    </Button>
  );
}

function EditMemberPermsModal({
  teamId,
  member,
  catalog,
  ownPerms,
  token,
  onClose,
  onSaved,
}: {
  teamId: string;
  member: TeamMember;
  catalog: PermissionData[];
  ownPerms: string[];
  token: string;
  onClose: () => void;
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
    <Modal
      open
      onClose={onClose}
      title={`Edit permissions — ${member.user?.username ?? "member"}`}
    >
      <div className="space-y-4">
        <PermSelector
          catalog={catalog}
          granterPerms={ownPerms}
          value={perms}
          onChange={setPerms}
        />

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" loading={saving} onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function DangerTab({ team, token }: { team: Team; token: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirmRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleClick() {
    if (!confirming) {
      setConfirming(true);
      confirmRef.current = setTimeout(() => setConfirming(false), 3000);
      return;
    }
    if (confirmRef.current) clearTimeout(confirmRef.current);
    setConfirming(false);
    setDeleting(true);
    setError(null);
    teams
      .deleteTeam(team.id, token)
      .then(() => router.push("/dashboard"))
      .catch((err) => {
        setError(
          err instanceof ApiError ? err.message : "Failed to delete team.",
        );
        setDeleting(false);
      });
  }

  return (
    <div className="max-w-lg space-y-4">
      <div className="rounded-xl border border-red-200 p-4 dark:border-red-900">
        <h3 className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
          Delete this team
        </h3>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          This permanently deletes {team.name}. Bots and servers owned by this
          team will be affected. This cannot be undone.
        </p>
        {error && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        <Button
          variant={confirming ? "danger" : "secondary"}
          loading={deleting}
          onClick={handleClick}
          className="mt-3"
        >
          <Trash2 size={14} />
          {confirming ? "Confirm delete?" : "Delete Team"}
        </Button>
      </div>
    </div>
  );
}
