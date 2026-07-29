"use client";

import { Pencil, ShieldAlert } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Pagination } from "@/components/search/Pagination";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { usePagination } from "@/hooks/usePagination";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import {
  type ArcadiaPermissionEntry,
  getFullPermissionCatalog,
} from "@/lib/arcadia/permissionCatalog";
import type { StaffMember } from "@/lib/arcadia/types";
import { useAdmin } from "../../../AdminContext";
import { MemberEditModal } from "./MemberEditModal";

const MEMBERS_PAGE_SIZE = 15;

export default function StaffMembersPage() {
  const { loginToken, staffMember, hasPerm } = useAdmin();

  const [members, setMembers] = useState<StaffMember[] | null>(null);
  const [catalog, setCatalog] = useState<ArcadiaPermissionEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<StaffMember | null>(null);

  const myLowestIndex = staffMember.positions.reduce(
    (min, p) => Math.min(min, p.index),
    Number.POSITIVE_INFINITY,
  );

  const { page, setPage, pageItems } = usePagination(
    members ?? [],
    MEMBERS_PAGE_SIZE,
  );

  const load = useCallback(async () => {
    try {
      const [list, cat] = await Promise.all([
        arcadia.staffMembers.list(loginToken),
        getFullPermissionCatalog(loginToken),
      ]);
      setMembers(list);
      setCatalog(cat);
    } catch (err) {
      setError(
        err instanceof ArcadiaError ? err.message : "Failed to load members.",
      );
    }
  }, [loginToken]);

  useEffect(() => {
    load();
  }, [load]);

  if (error && !members) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!members) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-50" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
        Staff Members
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        You can only edit members at or below your own rank.
      </p>

      {error && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="mt-6 space-y-2">
        {pageItems.map((member) => {
          const targetLowestIndex = member.positions.reduce(
            (min, p) => Math.min(min, p.index),
            Number.POSITIVE_INFINITY,
          );
          const locked = targetLowestIndex < myLowestIndex;

          return (
            <div
              key={member.user_id}
              className="flex items-center gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <Avatar
                src={member.user.avatar}
                alt={member.user.username}
                size={40}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-semibold text-zinc-950 dark:text-zinc-50">
                    {member.user.display_name || member.user.username}
                  </span>
                  {!member.mfa_verified && (
                    <Badge variant="danger">
                      <ShieldAlert size={11} />
                      No MFA
                    </Badge>
                  )}
                  {member.no_autosync && (
                    <Badge variant="warning">Frozen</Badge>
                  )}
                  {member.unaccounted && (
                    <Badge variant="warning">Unaccounted</Badge>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {member.positions.map((p) => (
                    <Badge key={p.id}>{p.name}</Badge>
                  ))}
                </div>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {member.resolved_perms.length} resolved permission
                  {member.resolved_perms.length === 1 ? "" : "s"}
                  {member.perm_overrides.length > 0 &&
                    ` · ${member.perm_overrides.length} override${member.perm_overrides.length === 1 ? "" : "s"}`}
                </p>
              </div>
              {hasPerm("staff_members.edit") && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={locked}
                  onClick={() => setEditing(member)}
                >
                  <Pencil size={12} />
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {members.length > 0 && (
        <div className="mt-6">
          <Pagination
            page={page}
            total={members.length}
            perPage={MEMBERS_PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      )}

      {editing && (
        <MemberEditModal
          loginToken={loginToken}
          granterPerms={staffMember.resolved_perms}
          catalog={catalog}
          member={editing}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
