"use client";

import { Button } from "@/components/ui/Button";

export const LINKED_ROLES_STATE_KEY = "omniplex-linked-roles-state";

export function linkedRolesRedirectUri() {
  return `${window.location.origin}/linked-roles/callback`;
}

interface ConnectButtonProps {
  clientId: string;
}

export function ConnectButton({ clientId }: ConnectButtonProps) {
  function connect() {
    const state = crypto.randomUUID();
    try {
      sessionStorage.setItem(LINKED_ROLES_STATE_KEY, state);
    } catch {}
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
