"use client";

import { ChevronRight } from "lucide-react";
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
import { usePagination } from "@/hooks/usePagination";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type { PlatformUser, RPCLogEntry } from "@/lib/arcadia/types";
import { formatRelativeTime } from "@/lib/utils/format";
import { useAdmin } from "../../AdminContext";
import { AdminPageHeader } from "../../AdminPageHeader";

const LOGS_PAGE_SIZE = 20;

type StateFilter = "all" | "success" | "failed" | "pending";

function fieldsOf(data: unknown): [string, unknown][] {
  if (!data || typeof data !== "object") return [];
  const entries = Object.entries(data as Record<string, unknown>);
  if (
    entries.length === 1 &&
    entries[0][1] &&
    typeof entries[0][1] === "object" &&
    !Array.isArray(entries[0][1])
  ) {
    return Object.entries(entries[0][1] as Record<string, unknown>);
  }
  return entries;
}

function labelFor(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/\bid\b/g, "ID")
    .replace(/^\w/, (c) => c.toUpperCase());
}

function display(value: unknown): string {
  if (value === null || value === undefined || value === "") return "None";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function stateVariant(state: string) {
  if (state === "success") return "success" as const;
  if (state === "pending") return "warning" as const;
  return "danger" as const;
}

export default function AdminLogsPage() {
  const { loginToken } = useAdmin();
  const [entries, setEntries] = useState<RPCLogEntry[] | null>(null);
  const [users, setUsers] = useState<Record<string, PlatformUser>>({});
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [state, setState] = useState<StateFilter>("all");
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    arcadia
      .getRpcLogEntries(loginToken)
      .then(async (list) => {
        setEntries(list);
        const uniqueIds = [...new Set(list.map((e) => e.user_id))];
        const resolved = await Promise.all(
          uniqueIds.map((id) =>
            arcadia.getUser(loginToken, id).catch(() => null),
          ),
        );
        setUsers(
          Object.fromEntries(
            uniqueIds
              .map((id, i) => [id, resolved[i]] as const)
              .filter((entry): entry is [string, PlatformUser] => !!entry[1]),
          ),
        );
      })
      .catch((err) =>
        setError(
          err instanceof ArcadiaError ? err.message : "Failed to load logs.",
        ),
      );
  }, [loginToken]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (entries ?? []).filter((e) => {
      if (state === "success" && e.state !== "success") return false;
      if (state === "pending" && e.state !== "pending") return false;
      if (
        state === "failed" &&
        (e.state === "success" || e.state === "pending")
      )
        return false;
      if (!needle) return true;
      const user = users[e.user_id];
      return (
        e.method.toLowerCase().includes(needle) ||
        e.user_id.includes(needle) ||
        (user?.username ?? "").toLowerCase().includes(needle) ||
        JSON.stringify(e.data ?? "")
          .toLowerCase()
          .includes(needle)
      );
    });
  }, [entries, users, query, state]);

  const { page, setPage, pageItems } = usePagination(visible, LOGS_PAGE_SIZE);

  if (error && !entries) return <AdminError message={error} onRetry={load} />;
  if (!entries) return <AdminLoading />;

  const count = (s: StateFilter) =>
    entries.filter((e) =>
      s === "failed"
        ? e.state !== "success" && e.state !== "pending"
        : e.state === s,
    ).length;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
      <AdminPageHeader
        title="RPC Logs"
        description="Every staff action taken through this panel, newest first. Open one to see exactly what was sent."
      />

      <AdminToolbar>
        <AdminSearch
          value={query}
          onChange={(v) => {
            setQuery(v);
            setPage(1);
          }}
          placeholder="Search by staff, action or target ID"
        />
        <AdminFilterChips
          value={state}
          onChange={(k) => {
            setState(k);
            setPage(1);
          }}
          chips={[
            { key: "all", label: "All", count: entries.length },
            { key: "success", label: "Succeeded", count: count("success") },
            {
              key: "failed",
              label: "Failed",
              count: count("failed"),
              tone: "danger",
            },
            {
              key: "pending",
              label: "Pending",
              count: count("pending"),
              tone: "warning",
            },
          ]}
        />
      </AdminToolbar>

      <div className="mt-6 divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
        {visible.length === 0 && (
          <AdminEmptyState message="No log entries match." />
        )}
        {pageItems.map((entry) => {
          const user = users[entry.user_id];
          const fields = fieldsOf(entry.data);
          const target = fields.find(([k]) => k === "target_id")?.[1];
          const reason = fields.find(([k]) => k === "reason")?.[1];
          const isOpen = open === entry.id;
          return (
            <div key={entry.id}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : entry.id)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
              >
                <ChevronRight
                  size={14}
                  className={[
                    "shrink-0 text-zinc-400 transition-transform",
                    isOpen ? "rotate-90" : "",
                  ].join(" ")}
                />
                {user ? (
                  <Avatar src={user.avatar} alt={user.username} size={26} />
                ) : (
                  <span className="h-[26px] w-[26px] shrink-0 rounded-full bg-zinc-100 dark:bg-zinc-800" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">
                    <span className="font-medium text-zinc-950 dark:text-zinc-50">
                      {user?.username ?? entry.user_id}
                    </span>{" "}
                    <span className="text-zinc-500 dark:text-zinc-400">
                      ran
                    </span>{" "}
                    <span className="font-medium text-zinc-950 dark:text-zinc-50">
                      {entry.method}
                    </span>
                    {target !== undefined && (
                      <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                        {" "}
                        on {display(target)}
                      </span>
                    )}
                  </p>
                  {typeof reason === "string" && reason && (
                    <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {reason}
                    </p>
                  )}
                </div>
                <Badge variant={stateVariant(entry.state)}>{entry.state}</Badge>
                <span
                  className="hidden w-20 shrink-0 text-right text-xs text-zinc-400 sm:block dark:text-zinc-500"
                  title={new Date(entry.created_at).toLocaleString()}
                >
                  {formatRelativeTime(entry.created_at)}
                </span>
              </button>
              {isOpen && (
                <div className="border-t border-zinc-100 bg-zinc-50/60 px-4 py-4 sm:pl-14 dark:border-zinc-800 dark:bg-zinc-950/40">
                  {fields.length > 0 ? (
                    <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[10rem_minmax(0,1fr)]">
                      {fields.map(([key, value]) => (
                        <div key={key} className="contents">
                          <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                            {labelFor(key)}
                          </dt>
                          <dd className="min-w-0 wrap-anywhere text-zinc-950 dark:text-zinc-50">
                            {display(value)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      No details were recorded for this action.
                    </p>
                  )}
                  <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
                    {new Date(entry.created_at).toLocaleString()} · log{" "}
                    <span className="font-mono">{entry.id}</span>
                  </p>
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
                      Raw data
                    </summary>
                    <pre className="mt-2 overflow-x-auto overflow-y-hidden rounded-lg bg-white p-3 font-mono text-xs text-zinc-700 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-zinc-800">
                      {JSON.stringify(entry.data, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {visible.length > LOGS_PAGE_SIZE && (
        <div className="mt-6">
          <Pagination
            page={page}
            total={visible.length}
            perPage={LOGS_PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
