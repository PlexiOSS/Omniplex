"use client";

// Copyright (C) 2026 NodeByte LTD

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { teams as teamsApi } from "@/lib/api";
import { hasPermString } from "@/lib/permissions";

export type PermissionTargetType =
  | "team"
  | "bot"
  | "server"
  | "pack"
  | "pack_emoji"
  | "pack_sticker"
  | "pack_sound";

export function useEntityPermission(
  targetType: PermissionTargetType,
  targetId: string | undefined,
) {
  const { session } = useAuth();
  const [perms, setPerms] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session || !targetId) {
      setPerms([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    teamsApi
      .getEntityPerms(session.user_id, targetType, targetId)
      .then((data) => {
        if (!cancelled) setPerms(data.perms);
      })
      .catch(() => {
        if (!cancelled) setPerms([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [session, targetType, targetId]);

  const hasPerm = useCallback(
    (perm: string) => hasPermString(perms, perm),
    [perms],
  );

  return {
    perms,
    hasPerm,
    hasAny: perms.length > 0,
    loading,
  };
}
