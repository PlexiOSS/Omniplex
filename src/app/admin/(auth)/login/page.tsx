"use client";

import { ShieldAlert } from "lucide-react";
import { useState } from "react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import { ARCADIA_PANEL_SCOPE } from "@/lib/arcadia/config";

export default function AdminLoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    setLoading(true);
    setError(null);
    try {
      const redirectUrl = `${window.location.origin}/admin/auth/callback`;
      const { login_url } = await arcadia.auth.begin(
        ARCADIA_PANEL_SCOPE,
        redirectUrl,
      );
      window.location.href = login_url;
    } catch (err) {
      setError(
        err instanceof ArcadiaError
          ? err.message
          : "Failed to start login. Please try again.",
      );
      setLoading(false);
    }
  }

  return (
    <Container className="flex flex-1 flex-col items-center justify-center py-24">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
          <ShieldAlert size={22} className="text-accent" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
            Staff Panel
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Sign in with Discord. Staff access and two-factor authentication
            required.
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <Button
          variant="primary"
          loading={loading}
          onClick={handleLogin}
          className="w-full"
        >
          Sign in with Discord
        </Button>
      </div>
    </Container>
  );
}
