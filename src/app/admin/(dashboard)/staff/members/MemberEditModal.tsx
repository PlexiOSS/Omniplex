"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type { PermissionData } from "@/lib/api/types";
import type { StaffMember } from "@/lib/arcadia/types";
import { ArcadiaPermSelector } from "../../ArcadiaPermSelector";

interface MemberEditModalProps {
  loginToken: string;
  granterPerms: string[];
  catalog: PermissionData[];
  member: StaffMember;
  onClose: () => void;
  onSaved: () => void;
}

export function MemberEditModal({
  loginToken,
  granterPerms,
  catalog,
  member,
  onClose,
  onSaved,
}: MemberEditModalProps) {
  const [permOverrides, setPermOverrides] = useState<string[]>(
    member.perm_overrides,
  );
  const [noAutosync, setNoAutosync] = useState(member.no_autosync);
  const [unaccounted, setUnaccounted] = useState(member.unaccounted);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await arcadia.staffMembers.edit(loginToken, {
        user_id: member.user_id,
        perm_overrides: permOverrides,
        no_autosync: noAutosync,
        unaccounted,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ArcadiaError ? err.message : "Failed to save.");
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={`Edit — ${member.user.username}`}>
      <div className="space-y-4">
        {member.positions.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Positions
            </p>
            <div className="flex flex-wrap gap-1.5">
              {member.positions.map((p) => (
                <Badge key={p.id}>{p.name}</Badge>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Resolved permissions{" "}
            <span className="font-normal text-zinc-400">
              ({member.resolved_perms.length})
            </span>
          </p>
          <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
            Everything this member can actually do — the combination of their
            positions above and the overrides below. Read-only here; edit
            positions on the Positions page.
          </p>
          {member.resolved_perms.length > 0 ? (
            <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto rounded-xl border border-zinc-200 p-2.5 dark:border-zinc-800">
              {member.resolved_perms.map((perm) => (
                <span
                  key={perm}
                  className="rounded-full bg-zinc-100 px-2.5 py-1 font-mono text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                >
                  {perm}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-400 dark:text-zinc-600">
              No permissions resolved for this member.
            </p>
          )}
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Permission overrides
          </p>
          <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
            Granted on top of whatever this member's positions already give
            them.
          </p>
          <ArcadiaPermSelector
            catalog={catalog}
            granterPerms={granterPerms}
            value={permOverrides}
            onChange={setPermOverrides}
            resolvedPerms={member.resolved_perms}
          />
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={noAutosync}
            onChange={(e) => setNoAutosync(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 accent-accent dark:border-zinc-700"
          />
          <span className="text-sm text-zinc-700 dark:text-zinc-300">
            Frozen — don't auto-update this member in resyncs
          </span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={unaccounted}
            onChange={(e) => setUnaccounted(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 accent-accent dark:border-zinc-700"
          />
          <span className="text-sm text-zinc-700 dark:text-zinc-300">
            Unaccounted for
          </span>
        </label>

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
