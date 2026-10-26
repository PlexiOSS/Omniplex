"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type {
  BadgeCatalogEntry,
  BadgeColor,
  BadgeRuleKind,
} from "@/lib/arcadia/types";
import { BADGE_ICON_NAMES, badgeIcon } from "@/lib/constants/badgeIcons";
import { EditorPage } from "../EditorPage";

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
  badge?: BadgeCatalogEntry;
  ruleKinds: BadgeRuleKind[];
  otherLinkedCount: number;
  onClose: () => void;
  onSaved: () => void;
}

export function BadgeEditModal({
  loginToken,
  badge,
  ruleKinds,
  otherLinkedCount,
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
  const [ruleType, setRuleType] = useState(badge?.auto_rule?.type ?? "");
  const [ruleValue, setRuleValue] = useState(
    badge?.auto_rule?.value ? String(badge.auto_rule.value) : "",
  );
  const [roleId, setRoleId] = useState(badge?.auto_rule?.role_id ?? "");
  const [linkedRole, setLinkedRole] = useState(badge?.linked_role ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleTargetType(type: string) {
    setTargetTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  }

  const Icon = badgeIcon(icon);
  const kind = ruleKinds.find((k) => k.type === ruleType);
  const availableKinds = ruleKinds.filter((k) =>
    k.targets.some((t) => targetTypes.includes(t)),
  );
  const categories = [...new Set(availableKinds.map((k) => k.category))];
  const appliesTo = kind
    ? kind.targets.filter((t) => targetTypes.includes(t))
    : [];
  const linkedFull = otherLinkedCount >= 5;
  const canLink = targetTypes.includes("user") && (linkedRole || !linkedFull);

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
        auto_rule: ruleType
          ? {
              type: ruleType,
              ...(kind?.value_label ? { value: Number(ruleValue) || 0 } : {}),
              ...(kind?.needs_role ? { role_id: roleId.trim() } : {}),
            }
          : null,
        linked_role: linkedRole && targetTypes.includes("user"),
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
    <EditorPage
      onBack={onClose}
      backLabel="Back to Badges"
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
                        : "bg-linear-to-r from-amber-500 to-yellow-400 text-white",
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

        <div className="space-y-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="badge-rule"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Award automatically
            </label>
            <select
              id="badge-rule"
              value={ruleType}
              onChange={(e) => setRuleType(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
            >
              <option value="">Off (staff award it by hand)</option>
              {ruleType && !kind && (
                <option value={ruleType}>Unknown rule: {ruleType}</option>
              )}
              {categories.map((c) => (
                <optgroup key={c} label={c}>
                  {availableKinds
                    .filter((k) => k.category === c)
                    .map((k) => (
                      <option key={k.type} value={k.type}>
                        {k.label}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
            {kind ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {kind.description} Applies to{" "}
                {appliesTo.length > 0
                  ? appliesTo.map((t) => `${t}s`).join(", ")
                  : "none of the selected types"}
                . Checked every hour, and removed again if they stop qualifying.
              </p>
            ) : ruleType ? (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                This rule type isn&apos;t known to this version of the panel.
                It&apos;s kept as it is unless you pick another.
              </p>
            ) : (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {availableKinds.length === 0
                  ? "Choose who it can be assigned to first."
                  : "Pick a requirement to award and remove this badge automatically."}
              </p>
            )}
          </div>

          {kind?.value_label && (
            <Input
              id="badge-rule-value"
              label={kind.value_label}
              type="number"
              min={kind.min_value ?? 1}
              value={ruleValue}
              onChange={(e) => setRuleValue(e.target.value)}
            />
          )}
          {kind?.needs_role && (
            <Input
              id="badge-rule-role"
              label="Role ID (in the main Omniplex server)"
              placeholder="123456789012345678"
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
            />
          )}

          <label
            className={[
              "flex items-start gap-2",
              canLink ? "cursor-pointer" : "cursor-not-allowed opacity-60",
            ].join(" ")}
          >
            <input
              type="checkbox"
              checked={linkedRole}
              disabled={!canLink}
              onChange={(e) => setLinkedRole(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-zinc-300 accent-accent dark:border-zinc-700"
            />
            <span>
              <span className="block text-sm text-zinc-700 dark:text-zinc-300">
                Use for Discord linked roles
              </span>
              <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                {!targetTypes.includes("user")
                  ? "Only badges that can be given to users can be linked roles."
                  : linkedFull && !linkedRole
                    ? "Discord allows 5 linked-role badges, and they're all in use."
                    : `Servers can require this badge for a role. ${otherLinkedCount + (linkedRole ? 1 : 0)} of 5 used.`}
              </span>
            </span>
          </label>
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
