"use client";

import { X } from "lucide-react";
import { useMemo, useState } from "react";
import type { ArcadiaPermissionEntry } from "@/lib/arcadia/permissionCatalog";
import { hasPermString } from "@/lib/permissions";

interface ArcadiaPermSelectorProps {
  catalog: ArcadiaPermissionEntry[];
  /** The permissions of the person doing the editing — you can't grant what you don't have. */
  granterPerms: string[];
  /** The override array being edited (what actually gets saved). */
  value: string[];
  onChange: (perms: string[]) => void;
  /**
   * The member's fully resolved permissions (positions + overrides already
   * combined), if known — e.g. `member.resolved_perms`. Without this, a
   * checkbox only reflects whether *this* editor has explicitly added the
   * permission as an override, not whether the member effectively has it
   * via a position — which reads as "granted but shown unchecked."
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

  // A namespace wildcard override (`ns.*`) supersedes every other perm in
  // that namespace, whether the wildcard came from an explicit override or
  // is already true via resolvedPerms (a position granting it).
  const hasWildcard =
    value.includes(`${activeNamespace}.*`) ||
    resolvedPerms.includes(`${activeNamespace}.*`);

  // STATIC_PERMISSION_CATALOG is hand-maintained and can drift out of sync
  // with what Arcadia actually checks server-side — without this, a granted
  // permission the catalog doesn't know about would just be silently
  // invisible here despite still being in effect.
  const unrecognized = useMemo(() => {
    const known = new Set<string>();
    for (const ns of namespaces) {
      for (const entry of grouped.get(ns) ?? []) {
        known.add(`${ns}.${entry.perm}`);
      }
    }
    return value.filter(
      (v) => namespaces.some((ns) => v.startsWith(`${ns}.`)) && !known.has(v),
    );
  }, [value, namespaces, grouped]);

  function removeUnrecognized(perm: string) {
    onChange(value.filter((p) => p !== perm));
  }

  /**
   * Three real states per permission, matching kittycat's actual model:
   *  - directly overridden on for this member (`key` in `value`)
   *  - granted some other way (a position) and not touched here — shown
   *    checked, but "off" means adding an explicit `~key` revoke, not
   *    just leaving it alone
   *  - explicitly revoked despite a position granting it (`~key` in `value`)
   */
  function toggle(namespace: string, perm: string) {
    const key = `${namespace}.${perm}`;
    const negated = `~${key}`;
    const isOverridden = value.includes(key);
    const isNegated = value.includes(negated);
    const isImplicit = resolvedPerms.includes(key) && !isOverridden;

    if (perm === "*") {
      const withoutNamespace = value.filter(
        (p) => !p.startsWith(`${namespace}.`) && p !== `~${namespace}.*`,
      );
      const effectivelyOn = isOverridden || (isImplicit && !isNegated);
      onChange(
        effectivelyOn
          ? isImplicit
            ? [...withoutNamespace, `~${namespace}.*`]
            : withoutNamespace
          : [...withoutNamespace, key],
      );
      return;
    }

    if (isOverridden) {
      onChange(value.filter((p) => p !== key));
    } else if (isNegated) {
      onChange(value.filter((p) => p !== negated));
    } else if (isImplicit) {
      onChange([...value, negated]);
    } else {
      onChange([...value, key]);
    }
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
          const negated = `~${key}`;
          const isOverridden = value.includes(key);
          const isNegated = value.includes(negated);
          const isImplicit = resolvedPerms.includes(key) && !isOverridden;
          const checked = isOverridden || (isImplicit && !isNegated);
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
                <p className="flex items-center gap-1.5 text-sm font-medium text-zinc-950 dark:text-zinc-50">
                  {entry.label}
                  {isImplicit && !isNegated && (
                    <span className="rounded-full bg-accent/10 px-1.5 py-0.5 text-[10px] font-normal text-accent">
                      via position
                    </span>
                  )}
                  {isNegated && (
                    <span className="rounded-full bg-red-500/10 px-1.5 py-0.5 text-[10px] font-normal text-red-600 dark:text-red-400">
                      revoked
                    </span>
                  )}
                </p>
                <p className="font-mono text-xs text-zinc-400 dark:text-zinc-600">
                  {key}
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
