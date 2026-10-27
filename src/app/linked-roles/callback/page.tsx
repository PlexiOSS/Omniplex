"use client";

import { CheckCircle2, Link2, XCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { StatusCard } from "@/components/ui/StatusCard";
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
    <Container className="flex flex-1 items-center py-24">
      {result ? (
        <StatusCard
          icon={CheckCircle2}
          tone="success"
          title={`You're connected, ${result.username}`}
          description={
            <>
              <p>
                {result.badges.length > 0
                  ? `Servers can now give you roles for: ${result.badges.join(", ")}.`
                  : "You don't have any linked-role badges yet. Your roles will update on their own when you earn one."}
              </p>
              <p className="mt-3 text-xs">
                You can close this tab and go back to Discord.
              </p>
            </>
          }
        />
      ) : error ? (
        <StatusCard
          icon={XCircle}
          tone="danger"
          title="Couldn't connect"
          description={error}
          actions={
            <Link href="/linked-roles">
              <Button variant="primary" size="sm">
                Try again
              </Button>
            </Link>
          }
        />
      ) : (
        <StatusCard
          icon={Link2}
          title="Connecting your Discord account…"
          description="This only takes a moment."
        />
      )}
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
