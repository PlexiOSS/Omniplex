"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { BsDiscord } from "react-icons/bs";
import { Button } from "@/components/ui/Button";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import { ARCADIA_PANEL_SCOPE } from "@/lib/arcadia/config";
import { AuthShell } from "../AuthShell";

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
          : "Couldn't start sign-in. Please try again.",
      );
      setLoading(false);
    }
  }

  return (
    <AuthShell step={1}>
      <h2 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
        Welcome back
      </h2>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        Sign in with the Discord account linked to your staff position. You'll
        confirm it with your authenticator app next.
      </p>

      {error && (
        <p className="mt-6 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-400">
          {error}
        </p>
      )}

      <Button
        variant="primary"
        size="lg"
        loading={loading}
        onClick={handleLogin}
        className="mt-8 w-full bg-[#5865F2]! text-white! hover:bg-[#4752c4]!"
      >
        <BsDiscord size={18} />
        Continue with Discord
      </Button>

      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-1.5 self-center text-xs text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        <ArrowLeft size={12} />
        Back to Omniplex
      </Link>
    </AuthShell>
  );
}
