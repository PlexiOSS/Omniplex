"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Container } from "@/components/layout/Container";
import { ServiceUnavailable } from "@/components/layout/ServiceUnavailable";
import { Button } from "@/components/ui/Button";
import { isBoundaryApiError } from "@/lib/utils/errors";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  // API / network errors → service unavailable UI
  if (isBoundaryApiError(error)) {
    return <ServiceUnavailable onRetry={unstable_retry} />;
  }

  return (
    <Container className="flex flex-1 flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/40">
        <AlertTriangle size={22} className="text-red-600 dark:text-red-400" />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
        An unexpected error stopped this page from loading. Trying again usually
        fixes it.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button variant="primary" onClick={unstable_retry}>
          <RefreshCw size={14} />
          Try again
        </Button>
        <Link href="/">
          <Button variant="secondary">Go home</Button>
        </Link>
      </div>
      <p className="mt-8 text-xs text-zinc-400 dark:text-zinc-500">
        Still broken?{" "}
        <Link href="/tickets" className="underline hover:text-accent">
          Open a support ticket
        </Link>
        {error.digest && (
          <>
            {" "}
            and include this code:{" "}
            <span className="font-mono text-zinc-600 dark:text-zinc-300">
              {error.digest}
            </span>
          </>
        )}
        .
      </p>
    </Container>
  );
}
