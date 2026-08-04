"use client";

import { X } from "lucide-react";
import { useMemo, useState } from "react";
import type { PermissionData } from "@/lib/api/types";
import { hasPermString, isSuperPerm } from "@/lib/permissions";

interface PermSelectorProps {
  catalog: PermissionData[];
  /** The permissions of the person doing the editing — you can't grant what you don't have. */
  granterPerms: string[];
  value: string[];
  onChange: (perms: string[]) => void;
}

export function PermSelector({
  catalog,
  granterPerms,
  value,
  onChange,
}: PermSelectorProps) {
  const grouped = useMemo(() => {
    const map = new Map<string, PermissionData[]>();
    for (const perm of catalog) {
      if (!map.has(perm.category)) map.set(perm.category, []);
      map.get(perm.category)?.push(perm);
    }
    return map;
  }, [catalog]);

  const categories = useMemo(() => Array.from(grouped.keys()), [grouped]);
  const [activeCategory, setActiveCategory] = useState(categories[0] ?? "");
  const perms = grouped.get(activeCategory) ?? [];
  const hasSuper = value.some(isSuperPerm);

  const known = useMemo(() => new Set(catalog.map((p) => p.id)), [catalog]);
  const unrecognized = useMemo(
    () => value.filter((v) => !known.has(v)),
    [value, known],
  );

  function removeUnrecognized(perm: string) {
    onChange(value.filter((p) => p !== perm));
  }

  function toggle(permId: string) {
    if (isSuperPerm(permId)) {
      // The super permission (owner/administrator) implies every other one,
      // so selecting it supersedes whatever else was picked.
      onChange(value.includes(permId) ? [] : [permId]);
      return;
    }
    onChange(
      value.includes(permId)
        ? value.filter((p) => p !== permId)
        : [...value, permId],
    );
  }

  if (categories.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        No permissions available.
      </p>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setActiveCategory(category)}
            className={[
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              category === activeCategory
                ? "bg-accent/10 text-accent"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
            ].join(" ")}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="mt-3 space-y-2">
        {perms.map((perm) => {
          const checked = value.includes(perm.id);
          const canGrant = hasPermString(granterPerms, perm.id);
          const disabled = !canGrant || (!isSuperPerm(perm.id) && hasSuper);

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
                onChange={() => toggle(perm.id)}
                className="mt-0.5 h-4 w-4 rounded border-zinc-300 accent-accent dark:border-zinc-700"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                  {perm.name}
                  {perm.dangerous && (
                    <span className="ml-1.5 text-xs font-normal text-red-500">
                      Dangerous
                    </span>
                  )}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {perm.desc}
                </p>
              </div>
            </label>
          );
        })}
      </div>

      {unrecognized.length > 0 && (
        <div className="pt-3 mt-4 border-t border-zinc-200 dark:border-zinc-800">
          <p className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Other granted permissions
          </p>
          <div className="flex flex-wrap gap-1.5">
            {unrecognized.map((perm) => (
              <span
                key={perm}
                className="flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 font-mono text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
              >
                {perm}
                <button
                  type="button"
                  onClick={() => removeUnrecognized(perm)}
                  aria-label={`Remove ${perm}`}
                  className="rounded-full hover:opacity-70"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
