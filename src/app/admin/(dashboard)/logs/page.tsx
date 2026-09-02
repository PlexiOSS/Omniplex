"use client";

import { useEffect, useState } from "react";
import { Pagination } from "@/components/search/Pagination";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { usePagination } from "@/hooks/usePagination";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type { PlatformUser, RPCLogEntry } from "@/lib/arcadia/types";
import { AdminPageHeader } from "../../AdminPageHeader";
import { useAdmin } from "../../AdminContext";

const LOGS_PAGE_SIZE = 20;

export default function AdminLogsPage() {
  const { loginToken } = useAdmin();
  const [entries, setEntries] = useState<RPCLogEntry[] | null>(null);
  const [users, setUsers] = useState<Record<string, PlatformUser>>({});
  const [error, setError] = useState<string | null>(null);
  const { page, setPage, pageItems } = usePagination(
    entries ?? [],
    LOGS_PAGE_SIZE,
  );

  useEffect(() => {
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

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <AdminPageHeader
        title="RPC Logs"
        description="Audit trail of every staff action taken through this panel."
      />

      {error && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {!entries && !error && (
        <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-50" /></div>
      )}

      {entries && (
        <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-2.5 font-medium">Method</th>
                <th className="px-4 py-2.5 font-medium">Staff</th>
                <th className="px-4 py-2.5 font-medium">State</th>
                <th className="px-4 py-2.5 font-medium">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
              {pageItems.map((entry) => {
                const user = users[entry.user_id];
                return (
                  <tr key={entry.id}>
                    <td className="px-4 py-2.5 font-medium text-zinc-950 dark:text-zinc-50">
                      {entry.method}
                    </td>
                    <td className="px-4 py-2.5 text-zinc-500 dark:text-zinc-400">
                      <div className="flex items-center gap-2">
                        {user && (
                          <Avatar src={user.avatar} alt={user.username} size={20} />
                        )}
                        {user?.username ?? entry.user_id}
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge
                        variant={
                          entry.state === "success"
                            ? "success"
                            : entry.state === "pending"
                              ? "warning"
                              : "danger"
                        }
                      >
                        {entry.state}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-zinc-500 dark:text-zinc-400">
                      {new Date(entry.created_at).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {entries.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
              No log entries yet.
            </p>
          )}
        </div>
      )}

      {entries && entries.length > 0 && (
        <div className="mt-6">
          <Pagination
            page={page}
            total={entries.length}
            perPage={LOGS_PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
