"use client";

import { formatRelativeTime } from "@omniplex/core/utils/format";
import { Avatar } from "@omniplex/ui/Avatar";
import { Button } from "@omniplex/ui/Button";
import { Check, Gavel, Plus, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RpcActionModal } from "@/app/(dashboard)/RpcActionModal";
import { useAdmin } from "@/app/AdminContext";
import { AdminPageHeader } from "@/app/AdminPageHeader";
import {
  AdminEmpty,
  AdminError,
  AdminLoading,
} from "@/components/admin/AdminState";
import { AdminFilterChips } from "@/components/admin/AdminToolbar";
import {
  DisciplinaryForm,
  DisciplinaryStatePill,
  describePeriod,
} from "@/components/admin/Disciplinary";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type {
  PlatformUser,
  StaffDisciplinary,
  StaffDisciplinaryType,
  StaffMember,
} from "@/lib/arcadia/types";

type Filter = "pending" | "active" | "all";

type Decision = {
  kind: "Approve" | "Deny" | "Revoke";
  item: StaffDisciplinary;
};

export default function DisciplinariesPage() {
  const { loginToken, staffMember } = useAdmin();
  const [filter, setFilter] = useState<Filter>("pending");
  const [items, setItems] = useState<StaffDisciplinary[] | null>(null);
  const [members, setMembers] = useState<StaffMember[]>([]);
  const [types, setTypes] = useState<StaffDisciplinaryType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [issuing, setIssuing] = useState(false);
  const [issueTo, setIssueTo] = useState("");

  const load = useCallback(async () => {
    try {
      setItems(await arcadia.disciplinaries.list(loginToken));
    } catch (err) {
      setError(
        err instanceof ArcadiaError
          ? err.message
          : "Failed to load disciplinaries.",
      );
    }
  }, [loginToken]);

  useEffect(() => {
    load();
    arcadia.staffMembers
      .list(loginToken)
      .then(setMembers)
      .catch(() => {});
    arcadia.staffDisciplinaryTypes
      .list(loginToken)
      .then(setTypes)
      .catch(() => {});
  }, [load, loginToken]);

  const users = useMemo(() => {
    const map = new Map<string, PlatformUser>();
    for (const m of members) map.set(m.user_id, m.user);
    return map;
  }, [members]);

  const name = (id: string | null) =>
    id
      ? id === staffMember.user_id
        ? "you"
        : users.get(id)?.display_name || users.get(id)?.username || id
      : "someone";

  const counts = useMemo(() => {
    const list = items ?? [];
    return {
      pending: list.filter((d) => d.state === "pending").length,
      active: list.filter((d) => d.state === "active").length,
      all: list.length,
    };
  }, [items]);

  const visible = (items ?? []).filter((d) =>
    filter === "all" ? true : d.state === filter,
  );

  const issuable = members
    .filter(
      (m) => m.user_id !== staffMember.user_id && m.rank > staffMember.rank,
    )
    .sort((a, b) => a.user.username.localeCompare(b.user.username));

  if (error)
    return (
      <AdminError
        message={error}
        onRetry={() => {
          setError(null);
          load();
        }}
      />
    );

  if (!items) return <AdminLoading />;

  const decisionCopy =
    decision?.kind === "Approve"
      ? { title: "Approve", confirm: "Approve", needsReason: false }
      : decision?.kind === "Deny"
        ? { title: "Deny", confirm: "Deny", needsReason: true }
        : { title: "Lift", confirm: "Lift", needsReason: true };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
      <AdminPageHeader
        title="Disciplinaries"
        description="Leave and disciplinaries across the staff team. Approving, denying or lifting one needs you to rank above the member, and approval can't come from whoever issued it."
        action={
          <Button
            variant="primary"
            size="sm"
            disabled={issuable.length === 0 || types.length === 0}
            onClick={() => {
              setIssueTo(issuable[0]?.user_id ?? "");
              setIssuing(true);
            }}
          >
            <Plus size={14} />
            Issue
          </Button>
        }
      />

      <div className="mt-6">
        <AdminFilterChips
          value={filter}
          onChange={setFilter}
          chips={[
            {
              key: "pending",
              label: "Needs approval",
              count: counts.pending,
              tone: counts.pending > 0 ? "warning" : "default",
            },
            { key: "active", label: "Active", count: counts.active },
            { key: "all", label: "All", count: counts.all },
          ]}
        />
      </div>

      {notice && (
        <div
          aria-live="polite"
          className="mt-4 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200"
        >
          <p className="min-w-0 flex-1 font-medium">{notice}</p>
          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="Dismiss"
            className="shrink-0 opacity-60 transition-opacity hover:opacity-100"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {visible.length === 0 ? (
        <AdminEmpty
          icon={Gavel}
          title={
            filter === "pending"
              ? "Nothing waiting for approval"
              : filter === "active"
                ? "Nobody has an active disciplinary"
                : "No disciplinaries yet"
          }
          description="Leave requests and issued disciplinaries show up here."
        />
      ) : (
        <ul className="mt-4 divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800/80 dark:border-zinc-800 dark:bg-zinc-900/60">
          {visible.map((d) => {
            const member = users.get(d.user_id);
            const period = describePeriod(d);
            const selfRequested = d.issued_by === d.user_id;
            return (
              <li
                key={d.id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start"
              >
                <Avatar
                  src={member?.avatar ?? ""}
                  alt={member?.username ?? d.user_id}
                  size={36}
                />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-semibold text-zinc-950 dark:text-zinc-50">
                      {member?.display_name || member?.username || d.user_id}
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-400">
                      {d.title}
                    </span>
                    <DisciplinaryStatePill state={d.state} />
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    {d.type.name} ·{" "}
                    {selfRequested
                      ? "requested by them"
                      : `issued by ${name(d.issued_by)}`}{" "}
                    {formatRelativeTime(d.created_at)}
                    {period && ` · ${period}`}
                  </p>
                  {d.description && (
                    <p className="mt-1.5 whitespace-pre-wrap wrap-anywhere text-sm text-zinc-700 dark:text-zinc-300">
                      {d.description}
                    </p>
                  )}
                  {d.decided_by && d.state !== "pending" && (
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      {d.state === "denied" ? "Denied" : "Approved"} by{" "}
                      {name(d.decided_by)}
                      {d.decision_note && `: ${d.decision_note}`}
                    </p>
                  )}
                  {d.revoked_by && (
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      Lifted by {name(d.revoked_by)}
                      {d.revoke_reason && `: ${d.revoke_reason}`}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {d.state === "pending" && (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setDecision({ kind: "Deny", item: d })}
                      >
                        <X size={13} />
                        Deny
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() =>
                          setDecision({ kind: "Approve", item: d })
                        }
                      >
                        <Check size={13} />
                        Approve
                      </Button>
                    </>
                  )}
                  {d.state === "active" && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setDecision({ kind: "Revoke", item: d })}
                    >
                      Lift
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {decision && (
        <RpcActionModal
          title={`${decisionCopy.title} ${decision.item.title} for ${
            users.get(decision.item.user_id)?.username ?? decision.item.user_id
          }`}
          confirmLabel={decisionCopy.confirm}
          danger={decision.kind === "Deny"}
          needsReason={decisionCopy.needsReason}
          onClose={() => setDecision(null)}
          onSubmit={async (note) => {
            await arcadia.disciplinaries.decide(
              loginToken,
              decision.kind,
              decision.item.id,
              note,
            );
            setNotice(
              `${decision.kind === "Approve" ? "Approved" : decision.kind === "Deny" ? "Denied" : "Lifted"} ${decision.item.title}.`,
            );
            await load();
          }}
        />
      )}

      {issuing && (
        <DisciplinaryForm
          title="Issue a disciplinary"
          submitLabel="Issue"
          reasonRequired
          types={types}
          member={
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="disc-member"
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Staff member
              </label>
              <select
                id="disc-member"
                value={issueTo}
                onChange={(e) => setIssueTo(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none transition-colors focus:border-accent/50 focus:ring-2 focus:ring-accent/15 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
              >
                {issuable.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.user.display_name || m.user.username} (@
                    {m.user.username})
                  </option>
                ))}
              </select>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Only staff ranked below you are listed.
              </p>
            </div>
          }
          onClose={() => setIssuing(false)}
          onSubmit={async (body) => {
            await arcadia.disciplinaries.issue(loginToken, {
              ...body,
              user_id: issueTo,
            });
            setNotice("Issued.");
            setFilter("all");
            await load();
          }}
        />
      )}
    </div>
  );
}
