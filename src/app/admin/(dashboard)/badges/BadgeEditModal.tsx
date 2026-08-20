"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type { BadgeCatalogEntry, BadgeColor } from "@/lib/arcadia/types";
import { BADGE_ICON_NAMES, badgeIcon } from "@/lib/constants/badgeIcons";

const TARGET_TYPES = ["user", "bot", "server", "team"] as const;
const COLORS: BadgeColor[] = [
  "default",
  "success",
  "warning",
  "danger",
  "info",
  "premium",
];

interface BadgeEditModalProps {
  loginToken: string;
  /** Omit for create; pass an existing badge for edit. */
  badge?: BadgeCatalogEntry;
  onClose: () => void;
  onSaved: () => void;
}

export function BadgeEditModal({
  loginToken,
  badge,
  onClose,
  onSaved,
}: BadgeEditModalProps) {
  const isEdit = !!badge;
  const [id, setId] = useState(badge?.id ?? "");
  const [name, setName] = useState(badge?.name ?? "");
  const [description, setDescription] = useState(badge?.description ?? "");
  const [icon, setIcon] = useState(badge?.icon ?? BADGE_ICON_NAMES[0]);
  const [color, setColor] = useState<BadgeColor>(badge?.color ?? "default");
  const [targetTypes, setTargetTypes] = useState<string[]>(
    badge?.target_types ?? [],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleTargetType(type: string) {
    setTargetTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  }

  const Icon = badgeIcon(icon);

  async function handleSave() {
    if (!id.trim() || !name.trim() || targetTypes.length === 0) {
      setError("ID, name, and at least one entity type are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        id: id.trim(),
        name: name.trim(),
        description: description.trim(),
        icon,
        color,
        target_types: targetTypes,
      };
      if (isEdit) {
        await arcadia.badges.edit(loginToken, payload);
      } else {
        await arcadia.badges.create(loginToken, payload);
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
      title={isEdit ? "Edit Badge" : "Create Badge"}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
          <span
            className={[
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
              color === "default"
                ? "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                : color === "success"
                  ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400"
                  : color === "warning"
                    ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400"
                    : color === "danger"
                      ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400"
                      : color === "info"
                        ? "bg-accent/10 text-accent"
                        : "bg-gradient-to-r from-amber-500 to-yellow-400 text-white",
            ].join(" ")}
          >
            <Icon size={12} />
            {name || "Preview"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            id="badge-id"
            label="ID"
            value={id}
            onChange={(e) => setId(e.target.value)}
            disabled={isEdit}
            required
          />
          <Input
            id="badge-name"
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="badge-description"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Description
          </label>
          <textarea
            id="badge-description"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="badge-icon"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Icon
            </label>
            <select
              id="badge-icon"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
            >
              {BADGE_ICON_NAMES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="badge-color"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Color
            </label>
            <select
              id="badge-color"
              value={color}
              onChange={(e) => setColor(e.target.value as BadgeColor)}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm capitalize text-zinc-950 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
            >
              {COLORS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Can be assigned to
          </p>
          <div className="flex flex-wrap gap-4">
            {TARGET_TYPES.map((type) => (
              <label
                key={type}
                className="flex cursor-pointer items-center gap-2"
              >
                <input
                  type="checkbox"
                  checked={targetTypes.includes(type)}
                  onChange={() => toggleTargetType(type)}
                  className="h-4 w-4 rounded border-zinc-300 accent-accent dark:border-zinc-700"
                />
                <span className="text-sm capitalize text-zinc-700 dark:text-zinc-300">
                  {type}s
                </span>
              </label>
            ))}
          </div>
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
