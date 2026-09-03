"use client";

import useSWR from "swr";
import { serverTemplates } from "@/lib/api";
import type { AuthSession } from "@/lib/api/types";

/** Server templates aren't embedded in /me like packs/bots are, so the
 * dashboard's Templates tab fetches its own list -- the existing
 * GET /server-templates/@all already supports an `owner` filter, so no new
 * backend endpoint is needed for "mine." */
export function useMyTemplates(session: AuthSession | null | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    session ? ["server-templates", session.user_id] : null,
    ([, userId]: [string, string]) =>
      serverTemplates.getAll(1, undefined, userId),
  );

  return {
    templates: data?.results ?? [],
    loading: isLoading,
    error,
    mutate,
  };
}
