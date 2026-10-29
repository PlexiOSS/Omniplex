"use client";

// Copyright (C) 2026 NodeByte LTD 

import { useCallback, useEffect, useState } from "react";
import type { AuthSession } from "@/lib/api/types";
import { clearSession, getSession, saveSession } from "@/lib/utils/auth";

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

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  return {
    session,
    loading,
    isAuthenticated: !!session,
    login,
    logout,
  };
}
