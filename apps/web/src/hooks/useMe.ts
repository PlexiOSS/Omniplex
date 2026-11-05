"use client";

// Copyright (C) 2026 NodeByte LTD

import { users } from "@omniplex/core/api";
import type { AuthSession } from "@omniplex/core/api/types";
import useSWR from "swr";

export function useMe(session: AuthSession | null | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    session ? ["user", session.user_id, session.token] : null,
    ([, userId, token]: [string, string, string]) =>
      users.getUser(userId, token),
  );

  return { me: data, loading: isLoading, error, mutate };
}
