"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type { ArcadiaPermissionEntry } from "@/lib/arcadia/permissionCatalog";
import type { StaffPosition } from "@/lib/arcadia/types";
import { ArcadiaPermSelector } from "../../ArcadiaPermSelector";

interface PositionEditModalProps {
  loginToken: string;
  granterPerms: string[];
  catalog: ArcadiaPermissionEntry[];
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!name.trim() || !roleId.trim()) {
      setError("Name and role ID are required.");
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
          corresponding_roles: position.corresponding_roles,
          perms,
          icon: icon.trim(),
        });
      } else {
        await arcadia.staffPositions.create(loginToken, {
          name: name.trim(),
          role_id: roleId.trim(),
          corresponding_roles: [],
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
    <Modal
      open
      onClose={onClose}
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
    </Modal>
  );
}
