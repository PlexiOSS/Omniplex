"use client";

import { SITE_URL } from "@omniplex/core/api/config";
import { Button } from "@omniplex/ui/Button";
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  FileText,
  Pencil,
  Plus,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAdmin } from "@/app/AdminContext";
import { AdminPageHeader } from "@/app/AdminPageHeader";
import {
  AdminEmpty,
  AdminError,
  AdminLoading,
} from "@/components/admin/AdminState";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type { AppPosition } from "@/lib/arcadia/types";

function Pill({
  tone,
  children,
}: {
  tone: "green" | "zinc" | "amber" | "accent";
  children: React.ReactNode;
}) {
  const cls = {
    green: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    zinc: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
    amber: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    accent: "bg-accent/10 text-accent",
  }[tone];
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      {children}
    </span>
  );
}

export default function ApplicationFormsPage() {
  const { loginToken, hasPerm } = useAdmin();
  const canEdit = hasPerm("manage_app_positions");
  const [positions, setPositions] = useState<AppPosition[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);

  const load = useCallback(async () => {
    try {
      setPositions(await arcadia.appPositions.list(loginToken));
    } catch (err) {
      setError(
        err instanceof ArcadiaError &&
          err.message.includes("UpdateAppPositions")
          ? "Application forms need the latest Popplio release."
          : err instanceof ArcadiaError
            ? err.message
            : "Failed to load application forms.",
      );
    }
  }, [loginToken]);

  useEffect(() => {
    load();
  }, [load]);

  async function move(index: number, by: -1 | 1) {
    if (!positions) return;
    const next = [...positions];
    const [item] = next.splice(index, 1);
    next.splice(index + by, 0, item);
    setPositions(next);
    setMoving(true);
    try {
      await arcadia.appPositions.reorder(
        loginToken,
        next.map((p) => p.id),
      );
    } catch (err) {
      setError(err instanceof ArcadiaError ? err.message : "Couldn't reorder.");
    } finally {
      setMoving(false);
    }
  }

  if (error)
    return (
      <AdminError
        message={error}
        onRetry={() => {
          setError(null);
          load();
        }}
      />
    );

  if (!positions) return <AdminLoading />;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
      <AdminPageHeader
        title="Application Forms"
        description="The positions people can apply for on the Apply page, and the questions each one asks."
        action={
          canEdit && (
            <Link href="/applications/forms/new">
              <Button variant="primary" size="sm">
                <Plus size={14} />
                New form
              </Button>
            </Link>
          )
        }
      />

      {positions.length === 0 ? (
        <AdminEmpty
          icon={FileText}
          title="No application forms"
          description="Create one to start taking applications."
        />
      ) : (
        <ul className="mt-6 divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800/80 dark:border-zinc-800 dark:bg-zinc-900/60">
          {positions.map((p, i) => (
            <li
              key={p.id}
              className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center"
            >
              {canEdit && (
                <div className="hidden shrink-0 flex-col sm:flex">
                  <button
                    type="button"
                    disabled={i === 0 || moving}
                    onClick={() => move(i, -1)}
                    aria-label={`Move ${p.name} up`}
                    className="rounded p-0.5 text-zinc-400 transition-colors hover:text-zinc-900 disabled:opacity-30 dark:hover:text-zinc-50"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    disabled={i === positions.length - 1 || moving}
                    onClick={() => move(i, 1)}
                    aria-label={`Move ${p.name} down`}
                    className="rounded p-0.5 text-zinc-400 transition-colors hover:text-zinc-900 disabled:opacity-30 dark:hover:text-zinc-50"
                  >
                    <ArrowDown size={14} />
                  </button>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                    {p.name}
                  </span>
                  <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500">
                    {p.id}
                  </span>
                  {p.closed ? (
                    <Pill tone="zinc">Closed</Pill>
                  ) : (
                    <Pill tone="green">Open</Pill>
                  )}
                  {p.hidden && <Pill tone="zinc">Hidden</Pill>}
                  {p.requires_main_server && (
                    <Pill tone="amber">Needs our server</Pill>
                  )}
                  {p.behaviour && (
                    <Pill tone="accent">
                      <Sparkles size={10} className="mr-1 inline" />
                      Built-in
                    </Pill>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {p.questions.length} question
                  {p.questions.length === 1 ? "" : "s"}
                  {p.pending_apps > 0 &&
                    ` · ${p.pending_apps} waiting for review`}
                  {p.behaviour && ` · ${p.behaviour.description}`}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                {!p.hidden && !p.closed && (
                  <a
                    href={`${SITE_URL}/apps/${p.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
                  >
                    View
                    <ExternalLink size={13} />
                  </a>
                )}
                {canEdit && (
                  <Link href={`/applications/forms/${p.id}`}>
                    <Button variant="secondary" size="sm">
                      <Pencil size={13} />
                      Edit
                    </Button>
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
