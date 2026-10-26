"use client";

import { Lock, Pencil, ShieldAlert } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminEmptyState } from "@/components/admin/AdminListRow";
import { AdminError, AdminLoading } from "@/components/admin/AdminState";
import {
  AdminFilterChips,
  AdminSearch,
  AdminToolbar,
} from "@/components/admin/AdminToolbar";
import { Pagination } from "@/components/search/Pagination";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { usePagination } from "@/hooks/usePagination";
import { staff } from "@/lib/api";
import type { PermissionData } from "@/lib/api/types";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type { StaffMember } from "@/lib/arcadia/types";
import { useAdmin } from "../../../AdminContext";
import { AdminPageHeader } from "../../../AdminPageHeader";
import { MemberEditModal } from "./MemberEditModal";

const MEMBERS_PAGE_SIZE = 15;

type MemberFilter = "all" | "no_mfa" | "frozen" | "unaccounted";

export default function StaffMembersPage() {
  const { loginToken, staffMember, hasPerm } = useAdmin();

  const [members, setMembers] = useState<StaffMember[] | null>(null);
  const [catalog, setCatalog] = useState<PermissionData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<MemberFilter>("all");

  const myLowestIndex = staffMember.rank;

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (members ?? [])
      .filter((m) =>
        filter === "no_mfa"
          ? !m.mfa_verified
          : filter === "frozen"
            ? m.no_autosync
            : filter === "unaccounted"
              ? m.unaccounted
              : true,
      )
      .filter(
        (m) =>
          !needle ||
          m.user_id.includes(needle) ||
          m.user.username.toLowerCase().includes(needle) ||
          (m.user.display_name ?? "").toLowerCase().includes(needle) ||
          m.positions.some((p) => p.name.toLowerCase().includes(needle)),
      )
      .sort((a, b) => a.rank - b.rank);
  }, [members, query, filter]);

  const { page, setPage, pageItems } = usePagination(
    visible,
    MEMBERS_PAGE_SIZE,
  );

  const load = useCallback(async () => {
    try {
      const [list, cat] = await Promise.all([
        arcadia.staffMembers.list(loginToken),
        staff.getPermissionCatalog(),
      ]);
      setMembers(list);
      setCatalog(cat.perms);
    } catch (err) {
      setError(
        err instanceof ArcadiaError ? err.message : "Failed to load members.",
      );
    }
  }, [loginToken]);

  useEffect(() => {
    load();
  }, [load]);

  if (error && !members)
    return (
      <AdminError
        message={error}
        onRetry={() => {
          setError(null);
          load();
        }}
      />
    );

  if (!members) return <AdminLoading />;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
      <AdminPageHeader
        title="Staff Members"
        description="You can only edit members at or below your own rank."
      />

      <AdminToolbar>
        <AdminSearch
          value={query}
          onChange={(v) => {
            setQuery(v);
            setPage(1);
          }}
          placeholder="Search by name, ID or position"
        />
        <AdminFilterChips
          value={filter}
          onChange={(k) => {
            setFilter(k);
            setPage(1);
          }}
          chips={[
            { key: "all", label: "All", count: members.length },
            {
              key: "no_mfa",
              label: "No MFA",
              count: members.filter((m) => !m.mfa_verified).length,
              tone: "danger",
            },
            {
              key: "frozen",
              label: "Frozen",
              count: members.filter((m) => m.no_autosync).length,
              tone: "warning",
            },
            {
              key: "unaccounted",
              label: "Unaccounted",
              count: members.filter((m) => m.unaccounted).length,
              tone: "warning",
            },
          ]}
        />
      </AdminToolbar>

      {error && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="mt-6 divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
        {visible.length === 0 && (
          <AdminEmptyState message="No staff members match." />
        )}
        {pageItems.map((member) => {
          const locked = member.rank < myLowestIndex;
          const isSelf = member.user_id === staffMember.user_id;
          const positions = [...member.positions].sort(
            (a, b) => a.index - b.index,
          );

          return (
            <div
              key={member.user_id}
              className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
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
                  {isSelf && <Badge variant="info">You</Badge>}
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
                  {positions.map((p, i) => (
                    <Badge key={p.id} variant={i === 0 ? "info" : "default"}>
                      {p.name}
                    </Badge>
                  ))}
                </div>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {member.resolved_perms.length} resolved permission
                  {member.resolved_perms.length === 1 ? "" : "s"}
                  {member.perm_overrides.length > 0 &&
                    ` · ${member.perm_overrides.length} override${member.perm_overrides.length === 1 ? "" : "s"}`}
                </p>
              </div>
              {hasPerm("manage_staff_members") &&
                (locked ? (
                  <span
                    title="Ranked above you, so you can't edit them"
                    className="px-2 text-zinc-300 dark:text-zinc-600"
                  >
                    <Lock size={13} />
                  </span>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditing(member)}
                    aria-label={`Edit ${member.user.username}`}
                  >
                    <Pencil size={12} />
                  </Button>
                ))}
            </div>
          );
        })}
      </div>

      {visible.length > MEMBERS_PAGE_SIZE && (
        <div className="mt-6">
          <Pagination
            page={page}
            total={visible.length}
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
