"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { PermissionData } from "@/lib/api/types";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type { Link, StaffPosition } from "@/lib/arcadia/types";
import { ArcadiaPermSelector } from "../../ArcadiaPermSelector";
import { EditorPage } from "../../EditorPage";

const CORRESPONDING_SERVERS = ["Main", "Testing", "Staff"] as const;

function roleFor(links: Link[], server: string) {
  return (
    links.find((l) => l.name.toLowerCase() === server.toLowerCase())?.value ??
    ""
  );
}

interface PositionEditModalProps {
  loginToken: string;
  granterPerms: string[];
  catalog: PermissionData[];
  /** Omit for create; pass an existing position for edit. */
  position?: StaffPosition;
  /** Only used when creating — where to insert the new position in the hierarchy. */
  defaultIndex?: number;
  onClose: () => void;
  onSaved: () => void;
}

export function PositionEditModal({
  loginToken,
  granterPerms,
  catalog,
  position,
  defaultIndex,
  onClose,
  onSaved,
}: PositionEditModalProps) {
  const isEdit = !!position;
  const [name, setName] = useState(position?.name ?? "");
  const [roleId, setRoleId] = useState(position?.role_id ?? "");
  const [icon, setIcon] = useState(position?.icon ?? "");
  const [index, setIndex] = useState(defaultIndex ?? 0);
  const [perms, setPerms] = useState<string[]>(position?.perms ?? []);
  const existingLinks = position?.corresponding_roles ?? [];
  const [corresponding, setCorresponding] = useState<Record<string, string>>(
    Object.fromEntries(
      CORRESPONDING_SERVERS.map((s) => [s, roleFor(existingLinks, s)]),
    ),
  );
  const otherLinks = existingLinks.filter(
    (l) =>
      !CORRESPONDING_SERVERS.some(
        (s) => s.toLowerCase() === l.name.toLowerCase(),
      ),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!name.trim() || !roleId.trim()) {
      setError("Name and role ID are required.");
      return;
    }
    const links: Link[] = [
      ...CORRESPONDING_SERVERS.filter((s) => corresponding[s]?.trim()).map(
        (s) => ({ name: s, value: corresponding[s].trim() }),
      ),
      ...otherLinks,
    ];
    if (links.some((l) => !/^\d{17,20}$/.test(l.value))) {
      setError("Corresponding roles must be Discord role IDs.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (isEdit && position) {
        await arcadia.staffPositions.edit(loginToken, {
          id: position.id,
          name: name.trim(),
          role_id: roleId.trim(),
          corresponding_roles: links,
          perms,
          icon: icon.trim(),
        });
      } else {
        await arcadia.staffPositions.create(loginToken, {
          name: name.trim(),
          role_id: roleId.trim(),
          corresponding_roles: links,
          perms,
          icon: icon.trim(),
          index,
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ArcadiaError ? err.message : "Failed to save.");
      setSaving(false);
    }
  }

  return (
    <EditorPage
      onBack={onClose}
      backLabel="Back to Positions"
      title={isEdit ? "Edit Position" : "Create Position"}
    >
      <div className="space-y-4">
        <Input
          id="position-name"
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          id="position-role-id"
          label="Discord Role ID (staff server)"
          value={roleId}
          onChange={(e) => setRoleId(e.target.value)}
          required
        />
        <Input
          id="position-icon"
          label="Icon"
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
        />
        {!isEdit && (
          <Input
            id="position-index"
            label="Hierarchy index (lower = more senior)"
            type="number"
            value={index}
            onChange={(e) => setIndex(Number(e.target.value))}
          />
        )}

        <div>
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Roles in other servers (optional)
          </p>
          <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
            Members in this position also get these roles, and lose them when
            they leave it.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {CORRESPONDING_SERVERS.map((server) => (
              <Input
                key={server}
                id={`position-corr-${server}`}
                label={`${server} server`}
                placeholder="Role ID"
                value={corresponding[server] ?? ""}
                onChange={(e) =>
                  setCorresponding((prev) => ({
                    ...prev,
                    [server]: e.target.value,
                  }))
                }
              />
            ))}
          </div>
          {otherLinks.length > 0 && (
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
              Also kept as is:{" "}
              {otherLinks.map((l) => `${l.name} (${l.value})`).join(", ")}
            </p>
          )}
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Permissions
          </p>
          <ArcadiaPermSelector
            catalog={catalog}
            granterPerms={granterPerms}
            value={perms}
            onChange={setPerms}
          />
        </div>

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
    </EditorPage>
  );
}
