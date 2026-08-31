"use client";

// Copyright (C) 2026 NodeByte LTD 

import useSWR from "swr";
import { users } from "@/lib/api";
import type { AuthSession } from "@/lib/api/types";

export function useMe(session: AuthSession | null | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    session ? ["user", session.user_id, session.token] : null,
    ([, userId, token]: [string, string, string]) => users.getUser(userId, token),
  );

  return { me: data, loading: isLoading, error, mutate };
}
