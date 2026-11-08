"use client";

import { apps as appsApi } from "@omniplex/core/api";
import { SITE_URL } from "@omniplex/core/api/config";
import type { AppQuestion, PlatformUser } from "@omniplex/core/api/types";
import { flaggedAnswer } from "@omniplex/core/appQuestions";
import { formatRelativeTime } from "@omniplex/core/utils/format";
import { Avatar } from "@omniplex/ui/Avatar";
import { Button } from "@omniplex/ui/Button";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ClipboardList,
  Copy,
  ExternalLink,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RpcActionModal } from "@/app/(dashboard)/RpcActionModal";
import { useAdmin } from "@/app/AdminContext";
import { AdminPageHeader } from "@/app/AdminPageHeader";
import { AdminError, AdminLoading } from "@/components/admin/AdminState";
import { AdminFilterChips } from "@/components/admin/AdminToolbar";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";

interface AppResponse {
  app_id: string;
  user?: PlatformUser;
  user_id: string;
  questions: AppQuestion[];
  answers: Record<string, string>;
  state: string;
  created_at: string;
  position: string;
  review_feedback: string | null;
  in_main_server?: boolean;
}

function FlagBadge({ app }: { app: AppResponse }) {
  const count = app.questions.filter((q) =>
    flaggedAnswer(q, app.answers[q.id]),
  ).length;
  if (count === 0) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
      <AlertTriangle size={12} />
      {count} flagged {count === 1 ? "answer" : "answers"}
    </span>
  );
}

function MembershipBadge({ member }: { member?: boolean }) {
  if (member === undefined) return null;
  return member ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      In our server
    </span>
  ) : (
    <span
      className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300"
      title="They'll need to join before they can be given roles"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      Not in our server
    </span>
  );
}

function applicantName(app: AppResponse) {
  return app.user?.display_name || app.user?.username || app.user_id;
}

function CopyId({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard
          ?.writeText(id)
          .then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          })
          .catch(() => {});
      }}
      title="Copy user ID"
      className="inline-flex items-center gap-1 rounded-md font-mono text-xs text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
    >
      {id}
      {copied ? (
        <Check size={12} className="text-emerald-500" />
      ) : (
        <Copy size={12} />
      )}
    </button>
  );
}

export default function AdminApplicationsPage() {
  const { loginToken, hasPerm } = useAdmin();

  const [apps, setApps] = useState<AppResponse[] | null>(null);
  const [positionNames, setPositionNames] = useState<Record<string, string>>(
    {},
  );
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalAction, setModalAction] = useState<{
    app: AppResponse;
    approve: boolean;
  } | null>(null);
  const [notice, setNotice] = useState<{
    message: string;
    staffNote?: string;
  } | null>(null);

  const load = useCallback(async () => {
    try {
      const { json } = await arcadia.popplioStaff<{ apps: AppResponse[] }>(
        loginToken,
        "GET",
        "/staff/apps",
      );
      setApps(
        (json?.apps ?? [])
          .filter((app) => app.state === "pending")
          .sort((a, b) => a.created_at.localeCompare(b.created_at)),
      );
    } catch (err) {
      setError(
        err instanceof ArcadiaError
          ? err.message
          : "Failed to load applications.",
      );
    }
  }, [loginToken]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    appsApi
      .getMeta()
      .then((meta) =>
        setPositionNames(
          Object.fromEntries(meta.positions.map((p) => [p.id, p.name])),
        ),
      )
      .catch(() => {});
  }, []);

  const positionName = useCallback(
    (id: string) => positionNames[id] ?? id,
    [positionNames],
  );

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const app of apps ?? []) {
      map.set(app.position, (map.get(app.position) ?? 0) + 1);
    }
    return map;
  }, [apps]);

  const visible = useMemo(
    () =>
      (apps ?? []).filter((app) => filter === "all" || app.position === filter),
    [apps, filter],
  );

  const selected =
    visible.find((app) => app.app_id === selectedId) ?? visible[0] ?? null;

  async function handleModalSubmit(reason: string) {
    if (!modalAction) return;
    const { app, approve } = modalAction;
    const { json } = await arcadia.popplioStaff<{ staff_note?: string }>(
      loginToken,
      "PATCH",
      `/staff/apps/${app.app_id}`,
      { approved: approve, reason },
    );
    setNotice({
      message: `${approve ? "Approved" : "Denied"} ${applicantName(app)}'s ${positionName(app.position)} application.`,
      staffNote: json?.staff_note,
    });
    setSelectedId(null);
    await load();
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

  if (!apps) return <AdminLoading />;

  const canManage = hasPerm("manage_apps");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
      <AdminPageHeader
        title="Applications"
        description={
          apps.length === 0
            ? "Nothing waiting for review."
            : `${apps.length} waiting for review, oldest first.`
        }
      />

      {notice && (
        <div
          aria-live="polite"
          className={[
            "mt-6 flex items-start gap-3 rounded-xl border p-4 text-sm",
            notice.staffNote
              ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200"
              : "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200",
          ].join(" ")}
        >
          {notice.staffNote ? (
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          ) : (
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <p className="font-medium">{notice.message}</p>
            {notice.staffNote && (
              <p className="mt-1">
                <span className="font-medium">Needs follow-up:</span>{" "}
                {notice.staffNote}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="Dismiss"
            className="shrink-0 opacity-60 transition-opacity hover:opacity-100"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {apps.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 py-24 text-center dark:border-zinc-800">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900">
            <ClipboardList size={20} className="text-zinc-400" />
          </div>
          <p className="mt-4 text-sm font-medium text-zinc-950 dark:text-zinc-50">
            All caught up
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            New staff, partner and certification applications show up here.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6">
            <AdminFilterChips
              value={filter}
              onChange={(id) => {
                setFilter(id);
                setSelectedId(null);
              }}
              chips={[
                { key: "all", label: "All", count: apps.length },
                ...[...counts.entries()].map(([id, n]) => ({
                  key: id,
                  label: positionName(id),
                  count: n,
                })),
              ]}
            />
          </div>

          <div className="mt-4 grid items-start gap-4 lg:grid-cols-[19rem_minmax(0,1fr)]">
            <ul className="overflow-hidden rounded-2xl border border-zinc-200 bg-white lg:sticky lg:top-6 dark:border-zinc-800 dark:bg-zinc-900/60">
              {visible.map((app) => {
                const active = selected?.app_id === app.app_id;
                return (
                  <li
                    key={app.app_id}
                    className="border-b border-zinc-100 last:border-b-0 dark:border-zinc-800/80"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedId(app.app_id)}
                      aria-current={active ? "true" : undefined}
                      className={[
                        "relative flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
                        active
                          ? "bg-accent/8"
                          : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
                      ].join(" ")}
                    >
                      {active && (
                        <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-accent" />
                      )}
                      <Avatar
                        src={app.user?.avatar ?? ""}
                        alt={applicantName(app)}
                        size={36}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                          {applicantName(app)}
                        </span>
                        <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                          {positionName(app.position)} ·{" "}
                          {formatRelativeTime(app.created_at)}
                          {app.in_main_server === false && (
                            <span className="text-amber-600 dark:text-amber-400">
                              {" "}
                              · Not in server
                            </span>
                          )}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {selected && (
              <article className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60">
                <header className="flex flex-col gap-4 border-b border-zinc-100 p-5 sm:flex-row sm:items-start sm:p-6 dark:border-zinc-800/80">
                  <Avatar
                    src={selected.user?.avatar ?? ""}
                    alt={applicantName(selected)}
                    size={56}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                        {applicantName(selected)}
                      </h2>
                      <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
                        {positionName(selected.position)}
                      </span>
                      <MembershipBadge member={selected.in_main_server} />
                      <FlagBadge app={selected} />
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
                      {selected.user?.username && (
                        <span>@{selected.user.username}</span>
                      )}
                      <CopyId id={selected.user_id} />
                    </div>
                    <p
                      className="mt-2 text-xs text-zinc-500 dark:text-zinc-400"
                      title={new Date(selected.created_at).toLocaleString()}
                    >
                      Applied {formatRelativeTime(selected.created_at)}
                    </p>
                  </div>
                  <a
                    href={`${SITE_URL}/user/${selected.user_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:border-accent/40 hover:text-accent dark:border-zinc-800 dark:text-zinc-300"
                  >
                    Profile
                    <ExternalLink size={13} />
                  </a>
                </header>

                <ol className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                  {selected.questions.map((q, i) => {
                    const answer = selected.answers[q.id]?.trim();
                    const flagged = flaggedAnswer(q, answer);
                    return (
                      <li
                        key={q.id}
                        className={[
                          "flex gap-4 px-5 py-5 sm:px-6",
                          flagged
                            ? "border-l-2 border-amber-500 bg-amber-500/5"
                            : "",
                        ].join(" ")}
                      >
                        <span className="w-6 shrink-0 pt-0.5 font-mono text-xs text-zinc-400 tabular-nums dark:text-zinc-500">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3 className="flex flex-wrap items-center gap-2 text-sm font-medium text-zinc-950 dark:text-zinc-50">
                            {q.question}
                            {flagged && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                                <AlertTriangle size={11} />
                                Flagged
                              </span>
                            )}
                          </h3>
                          {answer ? (
                            <p className="mt-1.5 max-w-prose whitespace-pre-wrap wrap-anywhere text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">
                              {answer}
                            </p>
                          ) : (
                            <p className="mt-1.5 text-sm text-zinc-400 italic dark:text-zinc-500">
                              No answer
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>

                {canManage && (
                  <footer className="sticky bottom-0 flex flex-col gap-3 border-t border-zinc-100 bg-white/90 px-5 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-zinc-800/80 dark:bg-zinc-900/90">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      The applicant gets your decision and reason as a
                      notification.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        onClick={() =>
                          setModalAction({ app: selected, approve: false })
                        }
                        className="text-red-600! hover:border-red-300! hover:bg-red-50! dark:text-red-400! dark:hover:border-red-900! dark:hover:bg-red-950/40!"
                      >
                        <X size={14} />
                        Deny
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() =>
                          setModalAction({ app: selected, approve: true })
                        }
                      >
                        <Check size={14} />
                        Approve
                      </Button>
                    </div>
                  </footer>
                )}
              </article>
            )}
          </div>
        </>
      )}

      {modalAction && (
        <RpcActionModal
          title={`${modalAction.approve ? "Approve" : "Deny"} ${applicantName(modalAction.app)}'s application`}
          confirmLabel={modalAction.approve ? "Approve" : "Deny"}
          danger={!modalAction.approve}
          onClose={() => setModalAction(null)}
          onSubmit={handleModalSubmit}
        />
      )}
    </div>
  );
}
