"use client";

import { ArrowRight, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StatusCard } from "@/components/ui/StatusCard";
import { useMyApplications } from "@/hooks/useApplications";
import { useAuth } from "@/hooks/useAuth";
import { useOAuthMeta } from "@/hooks/useOAuthMeta";

/** Matches the key /auth/sauron reads to decide which scope to request. */
const SCOPE_STORAGE_KEY = "auth_scope";

const STATE_LABELS: Record<
  string,
  { label: string; variant: "warning" | "success" | "danger" }
> = {
  pending: { label: "Pending Review", variant: "warning" },
  approved: { label: "Approved", variant: "success" },
  denied: { label: "Denied", variant: "danger" },
};

export default function BannedPage() {
  const { session, isAuthenticated, loading } = useAuth();
  const { apps: myApps, loading: appsLoading } = useMyApplications(session);
  const { data: oauthMeta } = useOAuthMeta();

  const existingAppeal = myApps.find((a) => a.position === "banappeal");

  function signInToAppeal() {
    if (!oauthMeta) return;
    localStorage.setItem(SCOPE_STORAGE_KEY, "ban_exempt");
    window.location.href = oauthMeta.url.replace(
      "%REDIRECT_URL%",
      window.location.origin,
    );
  }

  return (
    <Container className="flex flex-1 items-center py-24">
      <StatusCard
        icon={ShieldAlert}
        tone="danger"
        title="Your account is banned"
        description="You can still sign in to submit a ban appeal. That's the only part of the site available to you right now. If you think this is a mistake, explain why in your appeal."
      >
        {loading ? null : !isAuthenticated ? (
          <div className="mt-8">
            <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
              Sign in with the ban appeal option to continue.
            </p>
            <Button
              variant="primary"
              onClick={signInToAppeal}
              disabled={!oauthMeta}
            >
              Sign in
            </Button>
          </div>
        ) : appsLoading ? (
          <div className="mt-8 flex justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-50" />
          </div>
        ) : existingAppeal ? (
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-left dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                Your appeal
              </p>
              <Badge
                variant={
                  STATE_LABELS[existingAppeal.state]?.variant ?? "warning"
                }
              >
                {STATE_LABELS[existingAppeal.state]?.label ??
                  existingAppeal.state}
              </Badge>
            </div>
            {existingAppeal.review_feedback && (
              <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                "{existingAppeal.review_feedback}"
              </p>
            )}
            {!existingAppeal.review_feedback && (
              <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                We'll review it and follow up. You don't need to submit another
                one.
              </p>
            )}
          </div>
        ) : (
          <Link href="/apps/banappeal" className="mt-8 inline-block">
            <Button variant="primary">
              Submit a ban appeal
              <ArrowRight size={14} />
            </Button>
          </Link>
        )}
      </StatusCard>
    </Container>
  );
}
