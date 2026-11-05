"use client";

// Copyright (C) 2026 NodeByte LTD

import { auth } from "@omniplex/core/api";
import type { AuthSession } from "@omniplex/core/api/types";
import {
  clearSession,
  getSession,
  saveSession,
} from "@omniplex/core/utils/auth";
import { useCallback, useEffect, useState } from "react";

export function useAuth() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSession(getSession());
    setLoading(false);
  }, []);

  const login = useCallback((s: AuthSession) => {
    saveSession(s);
    setSession(s);
  }, []);

  const logout = useCallback(async () => {
    const current = getSession();
    if (current) {
      const ended = await auth
        .logout(current.token)
        .catch(() => auth.logout(current.token))
        .then(
          () => true,
          () => false,
        );
      if (!ended) return false;
    }
    clearSession();
    setSession(null);
    return true;
  }, []);

  return {
    session,
    loading,
    isAuthenticated: !!session,
    login,
    logout,
  };
}
