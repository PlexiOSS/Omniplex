// Arcadia sessions are a completely separate auth system from the normal
// Omniplex/Popplio user session — different token, different storage key,
// different (much shorter, non-refreshable) lifetime. Never mix the two.

const STORAGE_KEY = "arcadia-session";

// Arcadia hard-expires sessions 1 hour after creation server-side with no
// refresh mechanism (see docs/admin-panel-plan.md). We don't know the exact
// created_at until Hello responds, so this is an optimistic client-side
// estimate with a 5-minute safety margin — the server is the real authority
// and any call can still come back with "identityExpired"/"sessionNotActive".
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
