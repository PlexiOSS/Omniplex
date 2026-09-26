// Copyright (C) 2026 NodeByte LTD

import type { AuthSession } from "../api/types";

const STORAGE_KEY = "wistala";
export const SESSION_COOKIE = "omniplex_session";

function writeSessionCookie(session: AuthSession): void {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(session.token)}; Path=/; Expires=${new Date(session.expires_at).toUTCString()}; SameSite=Lax${secure}`;
}

function removeSessionCookie(): void {
  document.cookie = `${SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

function hasSessionCookie(): boolean {
  return document.cookie
    .split("; ")
    .some((c) => c.startsWith(`${SESSION_COOKIE}=`));
}

export function getSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as AuthSession;
    if (session.expires_at > Date.now()) {
      if (!hasSessionCookie()) writeSessionCookie(session);
      return session;
    }
    clearSession();
    return null;
  } catch {
    clearSession();
    return null;
  }
}

export function saveSession(session: AuthSession): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  writeSessionCookie(session);
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  removeSessionCookie();
}
