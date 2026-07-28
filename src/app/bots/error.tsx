"use client";

import { useEffect } from "react";
import { ServiceUnavailable } from "@/components/layout/ServiceUnavailable";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { isBoundaryApiError } from "@/lib/utils/errors";

export default function BotsError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[BotsError]", error);
  }, [error]);

  if (isBoundaryApiError(error)) {
    return <ServiceUnavailable inline onRetry={unstable_retry} />;
  }

  return (
    <Container className="flex flex-1 flex-col items-center justify-center py-24 text-center">
      <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
        Failed to load bots
      </h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        There was a problem fetching bot data. Please try again.
      </p>
      <Button variant="secondary" onClick={unstable_retry} className="mt-6">
        Try again
      </Button>
    </Container>
  );
}
