"use client";

import { Button } from "@omniplex/ui/Button";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  type LucideIcon,
  Package,
  Server,
  User,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { fieldInput } from "@/app/(dashboard)/GenericRpcModal";
import { useAdmin } from "@/app/AdminContext";
import { AdminPageHeader } from "@/app/AdminPageHeader";
import { AdminLoading } from "@/components/admin/AdminState";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type { RPCMethod, RPCWebAction, TargetType } from "@/lib/arcadia/types";

const TARGETS: Record<TargetType, { plural: string; icon: LucideIcon }> = {
  Bot: { plural: "bots", icon: Bot },
  Server: { plural: "servers", icon: Server },
  Team: { plural: "teams", icon: Users },
  Pack: { plural: "packs", icon: Package },
  User: { plural: "users", icon: User },
};

function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
      <h2 className="flex items-center gap-2.5 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent">
          {n}
        </span>
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/**
 * RPC actions that operate on every entity of a type at once (right now
 * just "reset all votes") rather than one specific bot/server/etc. --
 * `GenericRpcModal` always requires an entity to open from, which meant
 * running one of these meant navigating to some arbitrary bot or server's
 * row in Queue/Search first, even though the action ignores that entity
 * entirely. Any RPC method whose `fields` don't include `target_id` belongs
 * here instead -- today that's only VoteResetAll, but this stays correct
 * automatically if a future method follows the same shape.
 */
export default function AdminGlobalActionsPage() {
  const { loginToken } = useAdmin();
  const [methods, setMethods] = useState<RPCWebAction[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [methodId, setMethodId] = useState("");
  const [targetType, setTargetType] = useState<TargetType | "">("");
  const [values, setValues] = useState<
    Record<string, string | number | boolean>
  >({});
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    arcadia
      .getRpcMethods(loginToken, true)
      .then((all) => {
        const global = all.filter(
          (m) => !m.fields.some((f) => f.id === "target_id"),
        );
        setMethods(global);
        if (global[0]) {
          setMethodId(global[0].id);
          setTargetType(global[0].supported_target_types[0] ?? "");
        }
      })
      .catch((err) =>
        setLoadError(
          err instanceof ArcadiaError ? err.message : "Failed to load actions.",
        ),
      );
  }, [loginToken]);

  const method = useMemo(
    () => methods?.find((m) => m.id === methodId),
    [methods, methodId],
  );

  const missingField = method?.fields.some(
    (f) =>
      f.field_type !== "Boolean" && String(values[f.id] ?? "").trim() === "",
  );
  const ready = !!method && !!targetType && !missingField;
  const target = targetType ? TARGETS[targetType] : null;

  function selectMethod(id: string) {
    setMethodId(id);
    setValues({});
    setConfirming(false);
    setResult(null);
    setSubmitError(null);
    const next = methods?.find((m) => m.id === id);
    setTargetType(next?.supported_target_types[0] ?? "");
  }

  function setField(id: string, v: string | number | boolean) {
    setConfirming(false);
    setValues((prev) => ({ ...prev, [id]: v }));
  }

  async function handleSubmit() {
    if (!method || !targetType) return;
    setSubmitting(true);
    setSubmitError(null);
    setResult(null);
    try {
      const payload: Record<string, unknown> = {};
      for (const field of method.fields) {
        payload[field.id] =
          field.field_type === "Boolean"
            ? !!values[field.id]
            : field.field_type === "Number" || field.field_type === "Hour"
              ? Number(values[field.id] ?? 0)
              : (values[field.id] ?? "");
      }

      const rpcMethod = { [method.id]: payload } as unknown as RPCMethod;
      const res = await arcadia.executeRpc(loginToken, targetType, rpcMethod);
      setResult(res || "Done.");
      setValues({});
      setConfirming(false);
    } catch (err) {
      setSubmitError(
        err instanceof ArcadiaError ? err.message : "Action failed.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
      <AdminPageHeader
        title="Global Actions"
        description="Actions that run on every bot, server or other listing of a type at once. Use these sparingly: they can't be undone."
      />

      {loadError && (
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
          {loadError}
        </p>
      )}

      {!methods && !loadError && <AdminLoading />}

      {methods && methods.length === 0 && (
        <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 py-24 text-center dark:border-zinc-800">
          <Zap size={20} className="text-zinc-400" />
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
            None of the global actions are available to you.
          </p>
        </div>
      )}

      {methods && methods.length > 0 && (
        <div className="mt-6 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-4">
            <Step n={1} title="Choose an action">
              <div className="grid gap-2 sm:grid-cols-2">
                {methods.map((m) => {
                  const active = m.id === methodId;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => selectMethod(m.id)}
                      aria-pressed={active}
                      className={[
                        "flex items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                        active
                          ? "border-accent/50 bg-accent/5 ring-1 ring-accent/30"
                          : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                          active
                            ? "bg-accent text-accent-fg"
                            : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
                        ].join(" ")}
                      >
                        <Zap size={16} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-zinc-950 dark:text-zinc-50">
                          {m.label}
                        </span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                          {m.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </Step>

            {method && (
              <Step n={2} title="Choose what it applies to">
                <div className="flex flex-wrap gap-2">
                  {method.supported_target_types.map((t) => {
                    const { plural, icon: Icon } = TARGETS[t];
                    const active = t === targetType;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setTargetType(t);
                          setConfirming(false);
                        }}
                        aria-pressed={active}
                        className={[
                          "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                          active
                            ? "border-accent/50 bg-accent/10 font-medium text-accent"
                            : "border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:text-zinc-950 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-50",
                        ].join(" ")}
                      >
                        <Icon size={14} />
                        Every {plural.slice(0, -1)}
                      </button>
                    );
                  })}
                </div>
              </Step>
            )}

            {method && method.fields.length > 0 && (
              <Step n={3} title="Add the details">
                <div className="space-y-4">
                  {method.fields.map((field) =>
                    fieldInput(
                      field,
                      values[field.id] ??
                        (field.field_type === "Boolean" ? false : ""),
                      (v) => setField(field.id, v),
                    ),
                  )}
                </div>
              </Step>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Summary
              </p>
              {method && target ? (
                <>
                  <p className="mt-3 text-sm text-zinc-950 dark:text-zinc-50">
                    <span className="font-semibold">{method.label}</span> on{" "}
                    <span className="font-semibold">
                      every {target.plural.slice(0, -1)}
                    </span>{" "}
                    on Omniplex.
                  </p>
                  <div className="mt-4 flex gap-2.5 rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                    <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                    <span>
                      This changes all {target.plural} at once and can't be
                      undone. It's recorded in the activity log with your name.
                    </span>
                  </div>
                </>
              ) : (
                <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                  Choose an action to see what it will do.
                </p>
              )}

              {submitError && (
                <p className="mt-4 text-sm text-red-600 dark:text-red-400">
                  {submitError}
                </p>
              )}

              <div className="mt-5 space-y-2">
                {confirming ? (
                  <>
                    <Button
                      variant="danger"
                      className="w-full"
                      loading={submitting}
                      onClick={handleSubmit}
                    >
                      Yes, run on every {target?.plural.slice(0, -1)}
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full"
                      disabled={submitting}
                      onClick={() => setConfirming(false)}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="primary"
                    className="w-full"
                    disabled={!ready}
                    onClick={() => {
                      setResult(null);
                      setConfirming(true);
                    }}
                  >
                    Review and run
                  </Button>
                )}
                {!ready && method && missingField && (
                  <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
                    Fill in the details first.
                  </p>
                )}
              </div>
            </div>

            {result && (
              <div
                aria-live="polite"
                className="flex gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200"
              >
                <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                <span className="min-w-0 wrap-anywhere">{result}</span>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
