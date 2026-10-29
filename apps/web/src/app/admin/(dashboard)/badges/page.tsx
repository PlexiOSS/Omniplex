"use client";

import { Link2, Pencil, Plus, Trash2, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AdminEmptyState, AdminListRow } from "@/components/admin/AdminListRow";
import { AdminError, AdminLoading } from "@/components/admin/AdminState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type { BadgeCatalogEntry, BadgeRuleKind } from "@/lib/arcadia/types";
import { badgeIcon } from "@/lib/constants/badgeIcons";
import { useAdmin } from "../../AdminContext";
import { AdminPageHeader } from "../../AdminPageHeader";

export default function BadgesPage() {
  const router = useRouter();
  const { loginToken, hasPerm } = useAdmin();

  const [badges, setBadges] = useState<BadgeCatalogEntry[] | null>(null);
  const [ruleKinds, setRuleKinds] = useState<BadgeRuleKind[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const confirmRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    try {
      const [list, kinds] = await Promise.all([
        arcadia.badges.list(loginToken),
        arcadia.badges.ruleKinds(loginToken).catch(() => []),
      ]);
      setBadges(list);
      setRuleKinds(kinds);
    } catch (err) {
      setError(
        err instanceof ArcadiaError ? err.message : "Failed to load badges.",
      );
    }
  }, [loginToken]);

  useEffect(() => {
    load();
  }, [load]);

  function handleDeleteClick(id: string) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      confirmRef.current = setTimeout(() => setConfirmDeleteId(null), 3000);
      return;
    }
    if (confirmRef.current) clearTimeout(confirmRef.current);
    setConfirmDeleteId(null);
    setDeleting(id);
    arcadia.badges
      .delete(loginToken, id)
      .then(load)
      .catch((err) =>
        setError(
          err instanceof ArcadiaError ? err.message : "Failed to delete.",
        ),
      )
      .finally(() => setDeleting(null));
  }

  if (error && !badges)
    return (
      <AdminError
        message={error}
        onRetry={() => {
          setError(null);
          load();
        }}
      />
    );

  if (!badges) return <AdminLoading />;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
      <AdminPageHeader
        title="Badges"
        description="Decorative badges for users, bots, servers and teams. Award one from an entity's Actions menu in Search or Report detail, or give a badge a rule to award it automatically."
        action={
          hasPerm("manage_badges") && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => router.push("/admin/badges/new")}
            >
              <Plus size={14} />
              New Badge
            </Button>
          )
        }
      />

      {error && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="mt-6 divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
        {badges.length === 0 && <AdminEmptyState message="No badges yet." />}
        {badges.map((badge) => {
          const Icon = badgeIcon(badge.icon);
          return (
            <AdminListRow
              key={badge.id}
              actions={
                hasPerm("manage_badges") && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        router.push(
                          `/admin/badges/${encodeURIComponent(badge.id)}`,
                        )
                      }
                    >
                      <Pencil size={12} />
                    </Button>
                    <Button
                      variant={
                        confirmDeleteId === badge.id ? "danger" : "ghost"
                      }
                      size="sm"
                      loading={deleting === badge.id}
                      onClick={() => handleDeleteClick(badge.id)}
                    >
                      <Trash2 size={12} />
                    </Button>
                  </>
                )
              }
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant={badge.color}>
                  <Icon size={12} />
                  {badge.name}
                </Badge>
                <span className="text-xs text-zinc-400 dark:text-zinc-600">
                  {badge.id}
                </span>
                {badge.target_types.map((t) => (
                  <Badge key={t}>{t}</Badge>
                ))}
                {badge.auto_rule && (
                  <Badge variant="info">
                    <Zap size={11} />
                    {ruleKinds.find((k) => k.type === badge.auto_rule?.type)
                      ?.label ?? badge.auto_rule.type}
                    {badge.auto_rule.value ? ` (${badge.auto_rule.value})` : ""}
                  </Badge>
                )}
                {badge.linked_role && (
                  <Badge variant="success">
                    <Link2 size={11} />
                    Linked role
                  </Badge>
                )}
              </div>
              <p className="mt-0.5 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
                {badge.description}
              </p>
            </AdminListRow>
          );
        })}
      </div>
    </div>
  );
}
