"use client";

import type {
  AppPosition,
  AppResponse,
  AppState,
} from "@omniplex/core/api/types";
import { questionKind, splitMulti } from "@omniplex/core/appQuestions";
import { formatRelativeTime } from "@omniplex/core/utils/format";
import { Button } from "@omniplex/ui/Button";
import {
  ArrowRight,
  Check,
  ChevronDown,
  CircleCheck,
  CircleX,
  ClipboardList,
  Clock,
  MessageSquareQuote,
  RotateCcw,
  Star,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAppMeta } from "@/hooks/useApplications";

const STATE: Record<
  AppState,
  {
    label: string;
    icon: typeof Clock;
    pill: string;
    tile: string;
    next: string;
  }
> = {
  pending: {
    label: "In review",
    icon: Clock,
    pill: "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300",
    tile: "bg-amber-500/10 text-amber-600 ring-amber-500/20 dark:text-amber-400",
    next: "Our team will review it and you'll get a notification with the decision.",
  },
  approved: {
    label: "Approved",
    icon: CircleCheck,
    pill: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300",
    tile: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-400",
    next: "Congratulations! Check your notifications for the next steps.",
  },
  denied: {
    label: "Denied",
    icon: CircleX,
    pill: "bg-red-500/10 text-red-700 ring-red-500/20 dark:text-red-300",
    tile: "bg-red-500/10 text-red-600 ring-red-500/20 dark:text-red-400",
    next: "You can apply again once the position's cooldown has passed.",
  },
};

const STEPS = ["Submitted", "In review", "Decision"];

function Progress({ state }: { state: AppState }) {
  const reached = state === "pending" ? 1 : 2;
  return (
    <ol className="flex items-center gap-2">
      {STEPS.map((step, i) => {
        const done = i <= reached;
        const last = i === STEPS.length - 1;
        return (
          <li key={step} className="flex min-w-0 flex-1 items-center gap-2">
            <span
              className={[
                "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                done
                  ? state === "denied" && last
                    ? "bg-red-500 text-white"
                    : "bg-accent text-accent-fg"
                  : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800",
              ].join(" ")}
            >
              {done ? <Check size={11} strokeWidth={3} /> : i + 1}
            </span>
            <span
              className={[
                "truncate text-xs",
                done
                  ? "font-medium text-zinc-700 dark:text-zinc-300"
                  : "text-zinc-400",
              ].join(" ")}
            >
              {last && state !== "pending" ? STATE[state].label : step}
            </span>
            {!last && (
              <span
                className={[
                  "h-px min-w-4 flex-1",
                  i < reached ? "bg-accent/50" : "bg-zinc-200 dark:bg-zinc-800",
                ].join(" ")}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function Answer({ app, id }: { app: AppResponse; id: string }) {
  const question = app.questions.find((q) => q.id === id);
  const value = app.answers[id] ?? "";
  if (!question) return null;
  const kind = questionKind(question);

  if (kind === "multi") {
    return (
      <div className="flex flex-wrap gap-1.5">
        {splitMulti(value).map((choice) => (
          <span
            key={choice}
            className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          >
            {choice}
          </span>
        ))}
      </div>
    );
  }

  if (kind === "rating") {
    const n = Number(value) || 0;
    return (
      <span className="flex items-center gap-0.5" title={`${n} out of 5`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={14}
            className={
              i <= n
                ? "fill-amber-400 text-amber-400"
                : "text-zinc-300 dark:text-zinc-600"
            }
          />
        ))}
      </span>
    );
  }

  return (
    <p className="whitespace-pre-wrap break-words text-sm text-zinc-700 dark:text-zinc-300">
      {value}
    </p>
  );
}

function ApplicationCard({
  app,
  position,
}: {
  app: AppResponse;
  position: AppPosition | undefined;
}) {
  const [open, setOpen] = useState(false);
  const state = STATE[app.state];
  const Icon = state.icon;
  const answered = app.questions.filter((q) =>
    (app.answers[q.id] ?? "").trim(),
  );
  const canReapply =
    app.state === "denied" && position && !position.closed && !position.hidden;

  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="p-5">
        <div className="flex items-start gap-3">
          <span
            className={`flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 ${state.tile}`}
          >
            <Icon size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-zinc-950 dark:text-zinc-50">
                {position?.name ?? app.position}
              </h3>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${state.pill}`}
              >
                {state.label}
              </span>
            </div>
            <p
              className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400"
              title={new Date(app.created_at).toLocaleString()}
            >
              Applied {formatRelativeTime(app.created_at)} ·{" "}
              {new Date(app.created_at).toLocaleDateString(undefined, {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <Progress state={app.state} />
        </div>

        {app.review_feedback ? (
          <figure className="mt-4 rounded-xl border-l-2 border-accent bg-accent/5 px-4 py-3">
            <figcaption className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              <MessageSquareQuote size={13} className="text-accent" />
              Feedback from our team
            </figcaption>
            <blockquote className="mt-1 whitespace-pre-wrap text-sm text-zinc-800 dark:text-zinc-200">
              {app.review_feedback}
            </blockquote>
          </figure>
        ) : (
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            {state.next}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 bg-zinc-50/60 px-5 py-2.5 dark:border-zinc-800 dark:bg-zinc-950/40">
        {answered.length > 0 ? (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-zinc-50"
          >
            {open ? "Hide" : "View"} your answers
            <ChevronDown
              size={14}
              className={`transition-transform ${open ? "rotate-180" : ""}`}
            />
          </button>
        ) : (
          <span />
        )}
        {canReapply && (
          <Link
            href={`/apps/${app.position}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
          >
            <RotateCcw size={13} />
            Apply again
          </Link>
        )}
      </div>

      {open && (
        <dl className="divide-y divide-zinc-100 border-t border-zinc-100 dark:divide-zinc-800 dark:border-zinc-800">
          {answered.map((q) => (
            <div key={q.id} className="px-5 py-3">
              <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {q.question}
              </dt>
              <dd className="mt-1">
                <Answer app={app} id={q.id} />
              </dd>
            </div>
          ))}
        </dl>
      )}
    </article>
  );
}

export function ApplicationsTab({ apps }: { apps: AppResponse[] }) {
  const { data: meta } = useAppMeta();
  const sorted = apps
    .slice()
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  const counts = (["pending", "approved", "denied"] as const)
    .map((s) => [s, apps.filter((a) => a.state === s).length] as const)
    .filter(([, n]) => n > 0);
  const pendingPositions = new Set(
    apps.filter((a) => a.state === "pending").map((a) => a.position),
  );
  const open = (meta?.positions ?? []).filter(
    (p) => !p.hidden && !p.closed && !pendingPositions.has(p.id),
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {counts.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No applications yet
            </p>
          ) : (
            counts.map(([s, n]) => (
              <span
                key={s}
                className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${STATE[s].pill}`}
              >
                {n} {STATE[s].label.toLowerCase()}
              </span>
            ))
          )}
        </div>
        <Link href="/apps">
          <Button variant="secondary" size="sm">
            Browse positions
          </Button>
        </Link>
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 py-14 text-center dark:border-zinc-800">
          <span className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-accent/10 text-accent ring-1 ring-accent/15">
            <ClipboardList size={22} />
          </span>
          <p className="font-medium text-zinc-950 dark:text-zinc-50">
            You haven&apos;t applied for anything yet
          </p>
          <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
            Join the staff or dev team, become a partner, or get your listing
            certified.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map((app) => (
            <ApplicationCard
              key={app.app_id}
              app={app}
              position={meta?.positions.find((p) => p.id === app.position)}
            />
          ))}
        </div>
      )}

      {open.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
            Open positions
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {open.slice(0, 6).map((p) => (
              <Link
                key={p.id}
                href={`/apps/${p.id}`}
                className="group flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 transition-colors hover:border-accent/40 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-zinc-950 group-hover:text-accent dark:text-zinc-50">
                    {p.name}
                  </span>
                  {p.tags.length > 0 && (
                    <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {p.tags.join(" · ")}
                    </span>
                  )}
                </span>
                <ArrowRight
                  size={15}
                  className="shrink-0 text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-accent dark:text-zinc-600"
                />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
