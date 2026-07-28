"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { auth } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useOAuthMeta } from "@/hooks/useOAuthMeta";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";

function SauronInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useAuth();
  const { data: oauthMeta } = useOAuthMeta();
  const [error, setError] = useState<string | null>(null);
  const called = useRef(false);

  const code = searchParams.get("code");
  const discordError = searchParams.get("error");
  const discordErrorDescription = searchParams.get("error_description");

  useEffect(() => {
    // Discord returned an error
    if (discordError) {
      setError(discordErrorDescription ?? discordError);
      return;
    }

    // No code — shouldn't land here without one
    if (!code) {
      router.replace("/auth/login?error=no_code");
      return;
    }

    // Wait for OAuth metadata to load
    if (!oauthMeta) return;

    // Prevent duplicate calls
    if (called.current) return;
    called.current = true;

    const redirectUri = `${window.location.origin}/auth/sauron`;

    auth
      .callback(code, oauthMeta.client_id, redirectUri)
      .then((session) => {
        login(session);
        const stored = localStorage.getItem("auth_redirect");
        if (stored) {
          localStorage.removeItem("auth_redirect");
          window.location.href = window.location.origin + stored;
        } else {
          window.location.href = window.location.origin;
        }
      })
      .catch((err: unknown) => {
        called.current = false;
        const msg = err instanceof Error ? err.message : "Unknown error";
        if (msg.toLowerCase().includes("banned")) {
          setError(`You are banned from the list. If this is a mistake, please contact support.`);
        } else if (msg.toLowerCase().includes("used before")) {
          setError("This authorization code has already been used. Please try signing in again.");
        } else {
          setError("Sign in failed. Please try again.");
        }
      });
  }, [code, discordError, discordErrorDescription, oauthMeta, login, router]);

  if (error) {
    return (
      <Container className="flex flex-1 flex-col items-center justify-center py-24">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div>
            <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
              Sign in failed
            </h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{error}</p>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              variant="primary"
              onClick={() => {
                called.current = false;
                setError(null);
                router.replace("/auth/login");
              }}
            >
              Try again
            </Button>
            <Button variant="ghost" onClick={() => router.replace("/")}>
              Go to home
            </Button>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="flex flex-1 flex-col items-center justify-center py-24">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-50" />
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Signing you in…</p>
      </div>
    </Container>
  );
}

export default function AuthSauronPage() {
  return (
    <Suspense>
      <SauronInner />
    </Suspense>
  );
}
