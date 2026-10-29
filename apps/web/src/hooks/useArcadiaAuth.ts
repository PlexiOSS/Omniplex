"use client";

// Copyright (C) 2026 NodeByte LTD 

import { useCallback, useEffect, useState } from "react";
import { arcadia } from "@/lib/arcadia/client";
import {
  type ArcadiaSession,
  clearArcadiaSession,
  getArcadiaSession,
  saveArcadiaSession,
} from "@/lib/arcadia/session";

export function useArcadiaAuth() {
  const [session, setSession] = useState<ArcadiaSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSession(getArcadiaSession());
    setLoading(false);
  }, []);

  const login = useCallback((loginToken: string) => {
    const s = saveArcadiaSession(loginToken);
    setSession(s);
    return s;
  }, []);

  const logout = useCallback(() => {
    if (session) {
      arcadia.auth.logout(session.login_token).catch(() => {});
    }
    clearArcadiaSession();
    setSession(null);
  }, [session]);

  return {
    session,
    loading,
    isAuthenticated: !!session,
    login,
    logout,
  };
}
