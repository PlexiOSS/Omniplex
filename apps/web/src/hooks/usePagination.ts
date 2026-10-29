// Copyright (C) 2026 NodeByte LTD 

import { useEffect, useMemo, useState } from "react";

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
