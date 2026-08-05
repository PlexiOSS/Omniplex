"use client";

import { useState } from "react";
import type { PermissionData } from "@/lib/api/types";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type { StaffDisciplinaryType } from "@/lib/arcadia/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ArcadiaPermSelector } from "../../ArcadiaPermSelector";

interface DisciplinaryTypeEditModalProps {
  loginToken: string;
  granterPerms: string[];
  catalog: PermissionData[];
  /** Omit for create; pass an existing type for edit. */
  type?: StaffDisciplinaryType;
  onClose: () => void;
  onSaved: () => void;
}

export function DisciplinaryTypeEditModal({
  loginToken,
  granterPerms,
  catalog,
  type,
  onClose,
  onSaved,
}: DisciplinaryTypeEditModalProps) {
  const isEdit = !!type;
  const [id, setId] = useState(type?.id ?? "");
  const [name, setName] = useState(type?.name ?? "");
  const [description, setDescription] = useState(type?.description ?? "");
  const [selfAssignable, setSelfAssignable] = useState(
    type?.self_assignable ?? false,
  );
  const [additory, setAdditory] = useState(type?.additory ?? false);
  const [needsApproval, setNeedsApproval] = useState(
    type?.needs_approval ?? false,
  );
  const [maxExpiryHours, setMaxExpiryHours] = useState(
    type?.max_expiry != null ? String(Math.round(type.max_expiry / 3600)) : "",
  );
  const [permLimits, setPermLimits] = useState<string[]>(
    type?.perm_limits ?? [],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!id.trim() || !name.trim()) {
      setError("ID and name are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        id: id.trim(),
        name: name.trim(),
        description: description.trim(),
        self_assignable: selfAssignable,
        perm_limits: permLimits,
        additory,
        needs_approval: needsApproval,
        max_expiry: maxExpiryHours.trim()
          ? Number(maxExpiryHours) * 3600
          : null,
      };
      if (isEdit) {
        await arcadia.staffDisciplinaryTypes.edit(loginToken, payload);
      } else {
        await arcadia.staffDisciplinaryTypes.create(loginToken, payload);
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
      title={isEdit ? "Edit Disciplinary Type" : "Create Disciplinary Type"}
    >
      <div className="space-y-4">
        <Input
          id="disc-type-id"
          label="ID"
          value={id}
          onChange={(e) => setId(e.target.value)}
          disabled={isEdit}
          required
        />
        <Input
          id="disc-type-name"
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="disc-type-description"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Description
          </label>
          <textarea
            id="disc-type-description"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
          />
        </div>
        <Input
          id="disc-type-max-expiry"
          label="Max expiry (hours, optional)"
          type="number"
          min={0}
          value={maxExpiryHours}
          onChange={(e) => setMaxExpiryHours(e.target.value)}
        />

        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selfAssignable}
              onChange={(e) => setSelfAssignable(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 accent-accent dark:border-zinc-700"
            />
            <span className="text-sm text-zinc-700 dark:text-zinc-300">
              Self-assignable
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={additory}
              onChange={(e) => setAdditory(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 accent-accent dark:border-zinc-700"
            />
            <span className="text-sm text-zinc-700 dark:text-zinc-300">
              Additory (stacks with other active disciplinaries)
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={needsApproval}
              onChange={(e) => setNeedsApproval(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 accent-accent dark:border-zinc-700"
            />
            <span className="text-sm text-zinc-700 dark:text-zinc-300">
              Needs approval before taking effect
            </span>
          </label>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Permission limits (what a member is restricted to while this
            applies)
          </p>
          <ArcadiaPermSelector
            catalog={catalog}
            granterPerms={granterPerms}
            value={permLimits}
            onChange={setPermLimits}
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
