import { AlertTriangle, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { AuthShell } from "../AuthShell";
import { LoginButton } from "./LoginButton";

export const metadata = {
  title: "Sign in",
};

const ERROR_MESSAGES: Record<string, string> = {
  no_code: "Discord didn't send back a sign-in code. Please try again.",
  callback_failed: "Sign in failed. Please try again.",
};

interface Props {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const { error } = await searchParams;
  const errorMessage = error
    ? (ERROR_MESSAGES[error] ?? "Something went wrong. Please try again.")
    : null;

  return (
    <AuthShell>
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        Sign in to Omniplex
      </h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        Use your Discord account. There's no separate password to remember.
      </p>

      {errorMessage && (
        <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          {errorMessage}
        </div>
      )}

      <div className="mt-8">
        <LoginButton />
      </div>

      <p className="mt-4 flex items-start gap-2 text-xs text-zinc-500 dark:text-zinc-400">
        <ShieldCheck size={14} className="mt-px shrink-0 text-emerald-500" />
        We ask Discord for your basic profile and the list of servers you're in.
        We never see your password, email or messages.
      </p>

      <p className="mt-8 border-t border-zinc-100 pt-4 text-xs text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
        By signing in you agree to our{" "}
        <Link href="/legal/terms" className="underline hover:text-accent">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/legal/privacy" className="underline hover:text-accent">
          Privacy Policy
        </Link>
        .
      </p>
    </AuthShell>
  );
}
