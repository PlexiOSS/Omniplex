"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { Container } from "@/components/layout/Container";
import { linkedRoles } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import type { LinkedRolesResult } from "@/lib/api/types";
import { linkedRolesRedirectUri, takeLinkedRolesState } from "../ConnectButton";

function Callback() {
  const params = useSearchParams();
  const started = useRef(false);
  const [result, setResult] = useState<LinkedRolesResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const code = params.get("code");
    const state = params.get("state");
    const expected = takeLinkedRolesState();

    if (params.get("error")) {
      setError("You cancelled the connection on Discord.");
      return;
    }
    if (!code || (expected && state !== expected)) {
      setError(
        "This link has expired or didn't come from Omniplex. Start again from the Linked Roles page.",
      );
      return;
    }

    linkedRoles
      .connect(code, linkedRolesRedirectUri())
      .then(setResult)
      .catch((err) =>
        setError(
          err instanceof ApiError
            ? err.message
            : "Something went wrong connecting your account.",
        ),
      );
  }, [params]);

  return (
    <Container className="py-24">
      <div className="mx-auto max-w-md rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
        {!result && !error && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Connecting your Discord account…
          </p>
        )}
        {result && (
          <>
            <CheckCircle2 size={32} className="mx-auto text-emerald-500" />
            <h1 className="mt-3 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
              You&apos;re connected, {result.username}
            </h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              {result.badges.length > 0
                ? `Servers can now give you roles for: ${result.badges.join(", ")}.`
                : "You don't have any linked-role badges yet. Your roles will update on their own when you earn one."}
            </p>
            <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
              You can close this tab and go back to Discord.
            </p>
          </>
        )}
        {error && (
          <>
            <XCircle size={32} className="mx-auto text-red-500" />
            <h1 className="mt-3 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
              Couldn&apos;t connect
            </h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              {error}
            </p>
            <Link
              href="/linked-roles"
              className="mt-4 inline-block text-sm font-medium text-accent hover:underline"
            >
              Try again
            </Link>
          </>
        )}
      </div>
    </Container>
  );
}

export default function LinkedRolesCallbackPage() {
  return (
    <Suspense>
      <Callback />
    </Suspense>
  );
}
