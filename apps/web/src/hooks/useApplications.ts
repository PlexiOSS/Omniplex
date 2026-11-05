"use client";

// Copyright (C) 2026 NodeByte LTD

import { apps } from "@omniplex/core/api";
import type {
  AppListResponse,
  AppMeta,
  AuthSession,
} from "@omniplex/core/api/types";
import useSWR from "swr";

export function useAppMeta() {
  return useSWR<AppMeta>("apps/meta", () => apps.getMeta());
}

export function useMyApplications(session: AuthSession | null | undefined) {
  const { data, error, isLoading, mutate } = useSWR<AppListResponse>(
    session ? ["apps", session.user_id, session.token] : null,
    ([, userId, token]: [string, string, string]) => apps.list(userId, token),
  );

  return { apps: data?.apps ?? [], loading: isLoading, error, mutate };
}
