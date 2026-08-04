"use client";

import { X } from "lucide-react";
import { useMemo, useState } from "react";
import type { PermissionData } from "@/lib/api/types";
import { hasPermString, isSuperPerm } from "@/lib/permissions";

interface ArcadiaPermSelectorProps {
  catalog: PermissionData[];
  /** The permissions of the person doing the editing — you can't grant what you don't have. */
  granterPerms: string[];
  /** The override array being edited (what actually gets saved). */
  value: string[];
  onChange: (perms: string[]) => void;
  /**
   * The member's fully resolved permissions (position perms + overrides
   * already combined), if known — e.g. `member.resolved_perms`. Without
   * this, a checkbox only reflects whether this override list explicitly
   * grants the permission, not whether the member effectively has it via a
   * position — which reads as "granted but shown unchecked."
   *
   * There's no way to revoke a position-granted permission from here: the
   * flat model's overrides are purely additive (`perms.Resolve` is a union
   * of every source, nothing subtracts), unlike the old model's `~key`
   * negators. A permission granted by a position can only be removed by
   * editing the position itself.
   */
  resolvedPerms?: string[];
}

export function ArcadiaPermSelector({
  catalog,
  granterPerms,
  value,
  onChange,
  resolvedPerms = [],
}: ArcadiaPermSelectorProps) {
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
  const hasSuper = value.some(isSuperPerm) || resolvedPerms.some(isSuperPerm);

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
      <div className="flex max-h-32 flex-wrap gap-1 overflow-y-auto border-b border-zinc-200 pb-2 dark:border-zinc-800">
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

      <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
        {perms.map((perm) => {
          const isOverridden = value.includes(perm.id);
          const isImplicit =
            !isOverridden && resolvedPerms.includes(perm.id);
          const checked = isOverridden || isImplicit;
          const canGrant = hasPermString(granterPerms, perm.id);
          // A permission already granted via a position can't be usefully
          // toggled from here (there's nothing to remove — see the
          // resolvedPerms doc above), and the super permission supersedes
          // everything else once held.
          const disabled =
            !canGrant || isImplicit || (!isSuperPerm(perm.id) && hasSuper);

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
                <p className="flex items-center gap-1.5 text-sm font-medium text-zinc-950 dark:text-zinc-50">
                  {perm.name}
                  {perm.dangerous && (
                    <span className="ml-1.5 text-xs font-normal text-red-500">
                      Dangerous
                    </span>
                  )}
                  {isImplicit && (
                    <span className="rounded-full bg-accent/10 px-1.5 py-0.5 text-[10px] font-normal text-accent">
                      via position
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
        <div className="mt-4 border-t border-zinc-200 pt-3 dark:border-zinc-800">
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
