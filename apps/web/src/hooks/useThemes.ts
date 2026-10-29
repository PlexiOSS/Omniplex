"use client";

import useSWR from "swr";
import { themes } from "@/lib/api";
import type { AuthSession } from "@/lib/api/types";

/** Themes aren't embedded in /me, so the dashboard's Themes tab fetches
 * its own list via the existing `owner` filter on GET /themes/@all. */
export function useMyThemes(session: AuthSession | null | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    session ? ["themes", session.user_id] : null,
    ([, userId]: [string, string]) => themes.getAll(1, userId),
  );

  return {
    themes: data?.results ?? [],
    loading: isLoading,
    error,
    mutate,
  };
}
