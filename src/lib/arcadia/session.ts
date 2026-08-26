// Arcadia sessions are a completely separate auth system from the normal
// Omniplex/Popplio user session — different token, different storage key,
// different (much shorter, non-refreshable) lifetime. Never mix the two.

const STORAGE_KEY = "arcadia-session";

// Arcadia sessions now use sliding expiration server-side: an active session
// is pruned after 1 hour of no activity, with last_seen_at bumped on every
// successful authenticated call (see arcadia/impls/auth.go CheckAuth). This
// client-side value mirrors that — touchArcadiaSession() below resets it on
// every successful call, same as the server resets last_seen_at — with a
// 5-minute safety margin so we go stale slightly before the server does
// rather than slightly after. The server is still the real authority; any
// call can still come back with "identityExpired"/"sessionNotActive"
// regardless of what the client thinks.
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

/**
 * Resets the local idle clock, mirroring the server bumping last_seen_at on
 * every successful authenticated call. Call this after every successful
 * Arcadia request — see postQuery in client.ts. A no-op if there's no
 * current session (an unauthenticated call, or one that raced a logout).
 */
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
