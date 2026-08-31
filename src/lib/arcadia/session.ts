// Copyright (C) 2026 NodeByte LTD 

const STORAGE_KEY = "arcadia-session";
const SESSION_LIFETIME_MS = 55 * 60 * 1000;

export interface ArcadiaSession {
  login_token: string;
  expires_at: number;
}

export function getArcadiaSession(): ArcadiaSession | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as ArcadiaSession;
    if (session.expires_at > Date.now()) return session;
    localStorage.removeItem(STORAGE_KEY);
    return null;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function saveArcadiaSession(loginToken: string): ArcadiaSession {
  const session: ArcadiaSession = {
    login_token: loginToken,
    expires_at: Date.now() + SESSION_LIFETIME_MS,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  return session;
}

export function clearArcadiaSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function touchArcadiaSession(): void {
  if (typeof window === "undefined") return;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const session = JSON.parse(raw) as ArcadiaSession;
    session.expires_at = Date.now() + SESSION_LIFETIME_MS;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}
