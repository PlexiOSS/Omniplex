"use client";

import { useMemo, useState } from "react";
import type { PermissionData } from "@/lib/api/types";
import { hasPermString } from "@/lib/permissions";

interface PermSelectorProps {
  catalog: PermissionData[];
  /** The permissions of the person doing the editing — you can't grant what you don't have. */
  granterPerms: string[];
  value: string[];
  onChange: (perms: string[]) => void;
  /** Restrict to specific namespaces (e.g. just "team_member" when editing a member's perms). Omit for all. */
  namespaces?: string[];
}

function permName(entity: string, perm: PermissionData): string {
  const override = perm.data_override?.[entity];
  const name = override?.name ?? perm.name;
  return name.replace("{entity}", entity);
}

function permDesc(entity: string, perm: PermissionData): string {
  const override = perm.data_override?.[entity];
  const desc = override?.desc ?? perm.desc;
  return desc.replace("{entity}", entity);
}

export function PermSelector({
  catalog,
  granterPerms,
  value,
  onChange,
  namespaces,
}: PermSelectorProps) {
  const grouped = useMemo(() => {
    const map = new Map<string, PermissionData[]>();
    for (const perm of catalog) {
      for (const entity of perm.supported_entities) {
        if (namespaces && !namespaces.includes(entity)) continue;
        if (!map.has(entity)) map.set(entity, []);
        map.get(entity)?.push(perm);
      }
    }
    return map;
  }, [catalog, namespaces]);

  const entities = useMemo(() => Array.from(grouped.keys()), [grouped]);
  const [activeEntity, setActiveEntity] = useState(entities[0] ?? "");
  const perms = grouped.get(activeEntity) ?? [];
  const hasWildcard = value.includes(`${activeEntity}.*`);

  function toggle(entity: string, permId: string) {
    const key = `${entity}.${permId}`;
    if (permId === "*") {
      // Selecting the wildcard supersedes every other perm in this namespace.
      const withoutEntity = value.filter((p) => !p.startsWith(`${entity}.`));
      onChange(value.includes(key) ? withoutEntity : [...withoutEntity, key]);
      return;
    }
    onChange(
      value.includes(key) ? value.filter((p) => p !== key) : [...value, key],
    );
  }

  if (entities.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        No permissions available.
      </p>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1 border-b border-zinc-200 pb-2 dark:border-zinc-800">
        {entities.map((entity) => (
          <button
            key={entity}
            type="button"
            onClick={() => setActiveEntity(entity)}
            className={[
              "rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors",
              entity === activeEntity
                ? "bg-accent/10 text-accent"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
            ].join(" ")}
          >
            {entity.replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="mt-3 space-y-2">
        {perms.map((perm) => {
          const key = `${activeEntity}.${perm.id}`;
          const checked = value.includes(key);
          const canGrant = hasPermString(granterPerms, key);
          const disabled = !canGrant || (perm.id !== "*" && hasWildcard);

          return (
            <label
              key={perm.id}
              className={[
                "flex items-start gap-3 rounded-xl border p-3",
                disabled
                  ? "cursor-not-allowed border-zinc-100 opacity-50 dark:border-zinc-900"
                  : "cursor-pointer border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700",
              ].join(" ")}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={() => toggle(activeEntity, perm.id)}
                className="mt-0.5 h-4 w-4 rounded border-zinc-300 accent-accent dark:border-zinc-700"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                  {permName(activeEntity, perm)}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {permDesc(activeEntity, perm)}
                </p>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
