"use client";

// Copyright (C) 2026 NodeByte LTD 

import { useState } from "react";
import useSWR from "swr";
import { search } from "@/lib/api";
import type { SearchQuery, SearchResponse } from "@/lib/api/types";

export function useSearch() {
  const [query, setQuery] = useState<SearchQuery>({
    target_types: ["bot", "server", "team", "pack"],
  });
  const [committed, setCommitted] = useState<SearchQuery | null>(null);

  const { data, error, isLoading } = useSWR<SearchResponse>(
    committed ? ["search", committed] : null,
    () => search.search(committed!),
  );

  const run = (q: SearchQuery) => {
    setQuery(q);
    setCommitted(q);
  };

  const reset = () => {
    setQuery({ target_types: ["bot", "server", "team", "pack"] });
    setCommitted(null);
  };

  return {
    query,
    setQuery,
    results: data,
    error,
    isLoading,
    hasResults: !!committed,
    run,
    reset,
  };
}
