"use client";

import { Button } from "@/components/ui/Button";

export const LINKED_ROLES_STATE_KEY = "omniplex-linked-roles-state";

export function linkedRolesRedirectUri() {
  return `${window.location.origin}/linked-roles/callback`;
}

function cookieSecure() {
  return window.location.protocol === "https:" ? "; Secure" : "";
}

export function saveLinkedRolesState(state: string) {
  try {
    sessionStorage.setItem(LINKED_ROLES_STATE_KEY, state);
  } catch {}
  document.cookie = `${LINKED_ROLES_STATE_KEY}=${state}; Max-Age=900; Path=/linked-roles; SameSite=Lax${cookieSecure()}`;
}

export function takeLinkedRolesState(): string | null {
  let stored: string | null = null;
  try {
    stored = sessionStorage.getItem(LINKED_ROLES_STATE_KEY);
    sessionStorage.removeItem(LINKED_ROLES_STATE_KEY);
  } catch {}
  const cookie = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${LINKED_ROLES_STATE_KEY}=`));
  document.cookie = `${LINKED_ROLES_STATE_KEY}=; Max-Age=0; Path=/linked-roles; SameSite=Lax${cookieSecure()}`;
  return stored ?? cookie?.split("=")[1] ?? null;
}

interface ConnectButtonProps {
  clientId: string;
}

export function ConnectButton({ clientId }: ConnectButtonProps) {
  function connect() {
    const state = crypto.randomUUID();
    saveLinkedRolesState(state);
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      scope: "identify role_connections.write",
      redirect_uri: linkedRolesRedirectUri(),
      state,
      prompt: "consent",
    });
    window.location.href = `https://discord.com/oauth2/authorize?${params}`;
  }

  return (
    <Button variant="primary" className="mt-6 w-full" onClick={connect}>
      Connect with Discord
    </Button>
  );
}
