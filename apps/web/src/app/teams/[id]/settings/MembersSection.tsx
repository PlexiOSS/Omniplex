"use client";

import { teams } from "@omniplex/core/api";
import { ApiError } from "@omniplex/core/api/client";
import type {
  PermissionData,
  Team,
  TeamMember,
} from "@omniplex/core/api/types";
import { hasPermString } from "@omniplex/core/permissions";
import { formatCountLabel } from "@omniplex/core/utils/format";
import { Avatar } from "@omniplex/ui/Avatar";
import { Badge } from "@omniplex/ui/Badge";
import { Button } from "@omniplex/ui/Button";
import { Input } from "@omniplex/ui/Input";
import { Pencil, Plus, UserMinus } from "lucide-react";
import { useRef, useState } from "react";
import { FormMessage, SettingsCard } from "@/app/dashboard/manage/ManageShell";
import { PermSelector } from "@/components/teams/PermSelector";

export function MembersSection({
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
