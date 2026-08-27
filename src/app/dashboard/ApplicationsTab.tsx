"use client";

import { ClipboardList } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAppMeta } from "@/hooks/useApplications";
import type { AppResponse, AppState } from "@/lib/api/types";
import { formatRelativeTime } from "@/lib/utils/format";

const STATE_BADGE: Record<AppState, { label: string; variant: "warning" | "success" | "danger" }> = {
  pending: { label: "Pending", variant: "warning" },
  approved: { label: "Approved", variant: "success" },
  denied: { label: "Denied", variant: "danger" },
};

function ApplicationItem({ app }: { app: AppResponse }) {
  const { data: meta } = useAppMeta();
  const positionName =
    meta?.positions.find((p) => p.id === app.position)?.name ?? app.position;
  const badge = STATE_BADGE[app.state];

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-zinc-950 dark:text-zinc-50">
          {positionName}
        </p>
        <Badge variant={badge.variant}>{badge.label}</Badge>
      </div>
      <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-600">
        Applied {formatRelativeTime(app.created_at)}
      </p>
      {app.review_feedback && (
        <p className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
          {app.review_feedback}
        </p>
      )}
    </div>
  );
}

export function ApplicationsTab({ apps }: { apps: AppResponse[] }) {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {apps.length} application{apps.length === 1 ? "" : "s"}
        </p>
        <Link href="/apps">
          <Button variant="secondary" size="sm">
            Apply for something
          </Button>
        </Link>
      </div>

      {apps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ClipboardList
            size={32}
            className="mb-3 text-zinc-300 dark:text-zinc-700"
          />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            You haven&apos;t applied for anything yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {apps
            .slice()
            .sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime(),
            )
            .map((app) => (
              <ApplicationItem key={app.app_id} app={app} />
            ))}
        </div>
      )}
    </div>
  );
}
