"use client";

import { AlertTriangle, Check, Copy, Smartphone } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useArcadiaAuth } from "@/hooks/useArcadiaAuth";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type { MfaLoginSecret } from "@/lib/arcadia/types";
import { AuthShell } from "../../AuthShell";
import { OtpInput } from "../../OtpInput";

type Step = "exchanging" | "mfa" | "done" | "error";

function groupSecret(secret: string) {
  return (
    secret
      .replace(/\s/g, "")
      .match(/.{1,4}/g)
      ?.join(" ") ?? secret
  );
}

function SecretKey({ secret }: { secret: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(secret.replace(/\s/g, "")).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      }}
      className="group flex w-full items-center justify-between gap-3 rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-left transition-colors hover:border-teal-500 dark:border-zinc-700"
    >
      <span className="break-all font-mono text-xs text-zinc-700 dark:text-zinc-300">
        {groupSecret(secret)}
      </span>
      <span className="flex shrink-0 items-center gap-1 text-xs text-zinc-500 group-hover:text-teal-600 dark:text-zinc-400">
        {copied ? <Check size={13} /> : <Copy size={13} />}
        {copied ? "Copied" : "Copy"}
      </span>
    </button>
  );
}

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
      setError(
        discordError === "access_denied"
          ? "You cancelled the Discord sign-in."
          : discordError,
      );
      setStep("error");
      return;
    }
    if (!code) {
      setError("Discord didn't send back a sign-in code.");
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

  async function verify(value: string) {
    if (!loginToken || value.length !== 6 || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await arcadia.auth.activateSession(loginToken, value);
      setStep("done");
      router.replace("/admin");
    } catch (err) {
      setError(
        err instanceof ArcadiaError
          ? err.message
          : "That code didn't work. Check your app and try again.",
      );
      setOtp("");
      setSubmitting(false);
    }
  }

  if (step === "error") {
    return (
      <AuthShell step={1}>
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/40">
          <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
        </div>
        <h2 className="mt-4 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          Sign in failed
        </h2>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{error}</p>
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
          If this keeps happening, check that your Discord account has an active
          staff position.
        </p>
        <Button
          variant="primary"
          className="mt-8 w-full"
          onClick={() => router.replace("/admin/login")}
        >
          Try again
        </Button>
      </AuthShell>
    );
  }

  if (step === "exchanging" || step === "done") {
    return (
      <AuthShell step={step === "done" ? 3 : 1}>
        <div className="flex flex-col items-center py-8 text-center">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-zinc-200 border-t-teal-600 dark:border-zinc-800 dark:border-t-teal-400" />
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            {step === "done"
              ? "Verified. Opening the panel…"
              : "Checking your Discord account…"}
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell step={2}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          verify(otp);
        }}
      >
        <h2 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          {mfaSecret ? "Set up two-factor" : "Enter your code"}
        </h2>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          {mfaSecret
            ? "Scan the QR code with an authenticator app such as Google Authenticator, 1Password or Authy, then enter the 6-digit code it shows."
            : "Open your authenticator app and enter the 6-digit code for Omniplex."}
        </p>

        {mfaSecret && (
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:items-start">
            <div className="shrink-0 rounded-xl bg-white p-2 ring-1 ring-zinc-200 dark:ring-zinc-700">
              {/* biome-ignore lint/performance/noImgElement: inline SVG data URI, not a remote image next/image can optimize */}
              <img
                src={`data:image/svg+xml;utf8,${encodeURIComponent(mfaSecret.qr_code)}`}
                alt="QR code for your authenticator app"
                className="h-36 w-36"
              />
            </div>
            <div className="w-full min-w-0 space-y-2">
              <p className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                <Smartphone size={13} />
                Can't scan it?
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Add an account manually with this key:
              </p>
              <SecretKey secret={mfaSecret.secret} />
            </div>
          </div>
        )}

        <div className="mt-8">
          <OtpInput
            value={otp}
            onChange={(v) => {
              setOtp(v);
              if (error) setError(null);
            }}
            onComplete={verify}
            disabled={submitting}
          />
        </div>

        {error && (
          <p className="mt-4 text-center text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        <Button
          type="submit"
          variant="primary"
          loading={submitting}
          disabled={otp.length !== 6}
          className="mt-6 w-full bg-teal-600! text-white! hover:bg-teal-700!"
        >
          Verify and continue
        </Button>
      </form>
    </AuthShell>
  );
}

export default function AdminAuthCallbackPage() {
  return (
    <Suspense>
      <CallbackInner />
    </Suspense>
  );
}
