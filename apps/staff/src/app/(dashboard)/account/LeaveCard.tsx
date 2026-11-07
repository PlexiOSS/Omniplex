"use client";

import { Button } from "@omniplex/ui/Button";
import { CalendarClock, History, Plane } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAdmin } from "@/app/AdminContext";
import {
  DisciplinaryForm,
  DisciplinaryStatePill,
  describePeriod,
} from "@/components/admin/Disciplinary";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type {
  StaffDisciplinary,
  StaffDisciplinaryType,
} from "@/lib/arcadia/types";

function Row({
  d,
  busy,
  onEnd,
}: {
  d: StaffDisciplinary;
  busy: boolean;
  onEnd?: () => void;
}) {
  const period = describePeriod(d);
  return (
    <li className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start">
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-zinc-950 dark:text-zinc-50">
          {d.title}
          <DisciplinaryStatePill state={d.state} />
        </p>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          {d.type.name}
          {period && ` · ${period}`}
        </p>
        {d.description && (
          <p className="mt-1.5 whitespace-pre-wrap wrap-anywhere text-sm text-zinc-700 dark:text-zinc-300">
            {d.description}
          </p>
        )}
        {(d.decision_note || d.revoke_reason) && (
          <p className="mt-1.5 text-xs text-zinc-500 italic dark:text-zinc-400">
            {d.revoke_reason ?? d.decision_note}
          </p>
        )}
      </div>
      {onEnd && (
        <Button
          variant="secondary"
          size="sm"
          className="shrink-0 whitespace-nowrap"
          loading={busy}
          onClick={onEnd}
        >
          {d.state === "pending" ? "Cancel request" : "End early"}
        </Button>
      )}
    </li>
  );
}

export function LeaveCard() {
  const { loginToken, staffMember, refresh } = useAdmin();
  const [items, setItems] = useState<StaffDisciplinary[] | null>(null);
  const [types, setTypes] = useState<StaffDisciplinaryType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems(
        await arcadia.disciplinaries.list(loginToken, {
          userId: staffMember.user_id,
        }),
      );
    } catch (err) {
      setError(
        err instanceof ArcadiaError &&
          err.message.includes("UpdateDisciplinaries")
          ? "Leave and disciplinaries need the latest Popplio release."
          : err instanceof ArcadiaError
            ? err.message
            : "Couldn't load your leave and disciplinaries.",
      );
    }
  }, [loginToken, staffMember.user_id]);

  useEffect(() => {
    load();
    arcadia.staffDisciplinaryTypes
      .list(loginToken)
      .then((all) => setTypes(all.filter((t) => t.self_assignable)))
      .catch(() => {});
  }, [load, loginToken]);

  async function end(d: StaffDisciplinary) {
    setBusy(d.id);
    try {
      await arcadia.disciplinaries.decide(loginToken, "Revoke", d.id);
      await load();
      refresh();
    } catch (err) {
      setError(err instanceof ArcadiaError ? err.message : "Couldn't end it.");
    } finally {
      setBusy(null);
    }
  }

  const current = (items ?? []).filter(
    (d) => d.state === "active" || d.state === "pending",
  );
  const past = (items ?? []).filter(
    (d) => d.state !== "active" && d.state !== "pending",
  );

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60">
      <header className="flex flex-col gap-3 border-b border-zinc-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800/80">
        <div>
          <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
            Leave and disciplinaries
          </h2>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
            Time off you've requested, and anything issued to you.
          </p>
        </div>
        {types.length > 0 && (
          <Button
            variant="primary"
            size="sm"
            className="shrink-0 whitespace-nowrap"
            onClick={() => setRequesting(true)}
          >
            <Plane size={13} />
            Request leave
          </Button>
        )}
      </header>

      {error ? (
        <p className="px-5 py-4 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : !items ? (
        <p className="px-5 py-4 text-sm text-zinc-500 dark:text-zinc-400">
          Loading…
        </p>
      ) : current.length === 0 ? (
        <div className="flex items-center gap-3 px-5 py-5 text-sm text-zinc-500 dark:text-zinc-400">
          <CalendarClock size={18} className="shrink-0 text-zinc-400" />
          Nothing active. Taking a break? Request leave so the team knows.
        </div>
      ) : (
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
          {current.map((d) => (
            <Row
              key={d.id}
              d={d}
              busy={busy === d.id}
              onEnd={
                d.type.self_assignable ||
                (d.state === "pending" && d.issued_by === staffMember.user_id)
                  ? () => end(d)
                  : undefined
              }
            />
          ))}
        </ul>
      )}

      {past.length > 0 && (
        <div className="border-t border-zinc-100 dark:border-zinc-800/80">
          <button
            type="button"
            onClick={() => setShowHistory((s) => !s)}
            aria-expanded={showHistory}
            className="flex w-full items-center gap-2 px-5 py-3 text-left text-sm text-zinc-500 transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            <History size={14} />
            {showHistory ? "Hide" : "Show"} history ({past.length})
          </button>
          {showHistory && (
            <ul className="divide-y divide-zinc-100 border-t border-zinc-100 dark:divide-zinc-800/80 dark:border-zinc-800/80">
              {past.map((d) => (
                <Row key={d.id} d={d} busy={false} />
              ))}
            </ul>
          )}
        </div>
      )}

      {requesting && (
        <DisciplinaryForm
          title="Request leave"
          submitLabel="Request"
          types={types}
          onClose={() => setRequesting(false)}
          onSubmit={async (body) => {
            await arcadia.disciplinaries.request(loginToken, body);
            await load();
            refresh();
          }}
        />
      )}
    </section>
  );
}
