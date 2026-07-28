"use client";

import { useEffect } from "react";
import { ServiceUnavailable } from "@/components/layout/ServiceUnavailable";
import { Container } from "@/components/layout/Container";
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

  // Unexpected runtime error → generic fallback
  return (
    <Container className="flex flex-1 flex-col items-center justify-center py-24 text-center">
      <p className="font-mono text-sm text-zinc-400 dark:text-zinc-600">
        {error.digest ?? "ERR"}
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
        An unexpected error occurred. If this keeps happening, please let us
        know.
      </p>
      <Button variant="secondary" onClick={unstable_retry} className="mt-6">
        Try again
      </Button>
    </Container>
  );
}
