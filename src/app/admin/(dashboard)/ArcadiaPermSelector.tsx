"use client";

import { useMemo, useState } from "react";
import type { ArcadiaPermissionEntry } from "@/lib/arcadia/permissionCatalog";
import { hasPermString } from "@/lib/permissions";

interface ArcadiaPermSelectorProps {
  catalog: ArcadiaPermissionEntry[];
  /** The permissions of the person doing the editing — you can't grant what you don't have. */
  granterPerms: string[];
  value: string[];
  onChange: (perms: string[]) => void;
}

export function ArcadiaPermSelector({
  catalog,
  granterPerms,
  value,
  onChange,
}: ArcadiaPermSelectorProps) {
  const grouped = useMemo(() => {
    const map = new Map<string, ArcadiaPermissionEntry[]>();
    for (const entry of catalog) {
      if (!map.has(entry.namespace)) map.set(entry.namespace, []);
      map.get(entry.namespace)?.push(entry);
    }
    return map;
  }, [catalog]);

  const namespaces = useMemo(() => Array.from(grouped.keys()), [grouped]);
  const [activeNamespace, setActiveNamespace] = useState(namespaces[0] ?? "");
  const entries = grouped.get(activeNamespace) ?? [];
  const hasWildcard = value.includes(`${activeNamespace}.*`);

  function toggle(namespace: string, perm: string) {
    const key = `${namespace}.${perm}`;
    if (perm === "*") {
      const withoutNamespace = value.filter(
        (p) => !p.startsWith(`${namespace}.`),
      );
      onChange(
        value.includes(key) ? withoutNamespace : [...withoutNamespace, key],
      );
      return;
    }
    onChange(
      value.includes(key) ? value.filter((p) => p !== key) : [...value, key],
    );
  }

  if (namespaces.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        No permissions available.
      </p>
    );
  }

  return (
    <div>
      <div className="flex max-h-32 flex-wrap gap-1 overflow-y-auto border-b border-zinc-200 pb-2 dark:border-zinc-800">
        {namespaces.map((ns) => (
          <button
            key={ns}
            type="button"
            onClick={() => setActiveNamespace(ns)}
            className={[
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              ns === activeNamespace
                ? "bg-accent/10 text-accent"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
            ].join(" ")}
          >
            {ns}
          </button>
        ))}
      </div>

      <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
        {entries.map((entry) => {
          const key = `${activeNamespace}.${entry.perm}`;
          const checked = value.includes(key);
          const canGrant = hasPermString(granterPerms, key);
          const disabled = !canGrant || (entry.perm !== "*" && hasWildcard);

          return (
            <label
              key={entry.perm}
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
                onChange={() => toggle(activeNamespace, entry.perm)}
                className="mt-0.5 h-4 w-4 rounded border-zinc-300 accent-accent dark:border-zinc-700"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                  {entry.label}
                </p>
                <p className="font-mono text-xs text-zinc-400 dark:text-zinc-600">
                  {key}
                </p>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
