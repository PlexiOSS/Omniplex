import { useEffect, useMemo, useState } from "react";

/**
 * Arcadia's list endpoints (BotQueue, SearchEntitys, ListMembers,
 * GetRpcLogEntries) return the full result set with no server-side page/limit
 * params pagination here just slices what's already in memory, purely to
 * keep the DOM bounded on lists that can grow large over time.
 */
export function usePagination<T>(items: T[], perPage = 10) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageItems = useMemo(
    () => items.slice((page - 1) * perPage, page * perPage),
    [items, page, perPage],
  );

  return { page, setPage, totalPages, pageItems };
}
