"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useArcadiaAuth } from "@/hooks/useArcadiaAuth";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type { MfaLoginSecret } from "@/lib/arcadia/types";

type Step = "exchanging" | "mfa" | "error";

function CallbackInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useArcadiaAuth();
  const called = useRef(false);

  const [step, setStep] = useState<Step>("exchanging");
  const [error, setError] = useState<string | null>(null);
  const [mfaSecret, setMfaSecret] = useState<MfaLoginSecret | null>(null);
  const [loginToken, setLoginToken] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const code = searchParams.get("code");
  const discordError = searchParams.get("error");

  useEffect(() => {
    if (discordError) {
      setError(discordError);
      setStep("error");
      return;
    }
    if (!code) {
      setError("Missing authorization code.");
      setStep("error");
      return;
    }
    if (called.current) return;
    called.current = true;

    const redirectUrl = `${window.location.origin}/admin/auth/callback`;

    (async () => {
      try {
        const token = await arcadia.auth.createSession(code, redirectUrl);
        login(token);
        setLoginToken(token);

        const mfa = await arcadia.auth.checkMfaState(token);
        setMfaSecret(mfa.info);
        setStep("mfa");
      } catch (err) {
        setError(err instanceof ArcadiaError ? err.message : "Sign in failed.");
        setStep("error");
      }
    })();
  }, [code, discordError, login]);

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault();
    if (!loginToken || !otp.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await arcadia.auth.activateSession(loginToken, otp.trim());
      router.replace("/admin");
    } catch (err) {
      setError(
        err instanceof ArcadiaError ? err.message : "Invalid code, try again.",
      );
      setSubmitting(false);
    }
  }

  if (step === "error") {
    return (
      <Container className="flex flex-1 flex-col items-center justify-center py-24 text-center">
        <div className="w-full max-w-sm space-y-4">
          <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
            Sign in failed
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{error}</p>
          <Button
            variant="secondary"
            onClick={() => router.replace("/admin/login")}
          >
            Try again
          </Button>
        </div>
      </Container>
    );
  }

  if (step === "exchanging") {
    return (
      <Container className="flex flex-1 flex-col items-center justify-center py-24 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-50" />
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
          Signing you in…
        </p>
      </Container>
    );
  }

  // step === "mfa"
  return (
    <Container className="flex flex-1 flex-col items-center justify-center py-24">
      <form
        onSubmit={handleActivate}
        className="w-full max-w-sm space-y-5 text-center"
      >
        <div>
          <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
            Two-factor authentication
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            {mfaSecret
              ? "Scan this QR code with your authenticator app, then enter the code it shows."
              : "Enter the code from your authenticator app."}
          </p>
        </div>

        {mfaSecret && (
          <div className="flex flex-col items-center gap-2">
            {/* biome-ignore lint/performance/noImgElement: inline SVG data URI, not a remote image next/image can optimize */}
            <img
              src={`data:image/svg+xml;utf8,${encodeURIComponent(mfaSecret.qr_code)}`}
              alt="MFA QR code"
              className="h-48 w-48"
            />
            <p className="break-all font-mono text-xs text-zinc-400">
              {mfaSecret.secret}
            </p>
          </div>
        )}

        <Input
          id="otp"
          label="Authentication code"
          placeholder="123456"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          autoComplete="one-time-code"
          required
        />

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <Button
          type="submit"
          variant="primary"
          loading={submitting}
          className="w-full"
        >
          Verify
        </Button>
      </form>
    </Container>
  );
}

export default function AdminAuthCallbackPage() {
  return (
    <Suspense>
      <CallbackInner />
    </Suspense>
  );
}
