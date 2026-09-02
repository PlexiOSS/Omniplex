"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type { RPCMethod, RPCWebAction, TargetType } from "@/lib/arcadia/types";
import { useAdmin } from "../../AdminContext";
import { AdminPageHeader } from "../../AdminPageHeader";
import { fieldInput } from "../GenericRpcModal";

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

  function selectMethod(id: string) {
    setMethodId(id);
    setValues({});
    const next = methods?.find((m) => m.id === id);
    setTargetType(next?.supported_target_types[0] ?? "");
  }

  function setField(id: string, v: string | number | boolean) {
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
      setResult(res ?? "Done.");
    } catch (err) {
      setSubmitError(
        err instanceof ArcadiaError ? err.message : "Action failed.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <AdminPageHeader
        title="Global Actions"
        description="RPC actions that apply to every entity of a type at once — no specific bot, server, or team to pick."
      />

      {loadError && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">
          {loadError}
        </p>
      )}

      {!methods && !loadError && (
        <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-50" /></div>
      )}

      {methods && methods.length === 0 && (
        <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">
          No global actions available to you.
        </p>
      )}

      {methods && methods.length > 0 && (
        <div className="mt-6 space-y-4 rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="global-action-method"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Action
            </label>
            <select
              id="global-action-method"
              value={methodId}
              onChange={(e) => selectMethod(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
            >
              {methods.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
            {method && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {method.description}
              </p>
            )}
          </div>

          {method && (
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="global-action-target-type"
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Applies to
              </label>
              <select
                id="global-action-target-type"
                value={targetType}
                onChange={(e) => setTargetType(e.target.value as TargetType)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
              >
                {method.supported_target_types.map((t) => (
                  <option key={t} value={t}>
                    Every {t}
                  </option>
                ))}
              </select>
            </div>
          )}

          {method?.fields.map((field) =>
            fieldInput(
              field,
              values[field.id] ?? (field.field_type === "Boolean" ? false : ""),
              (v) => setField(field.id, v),
            ),
          )}

          {submitError && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {submitError}
            </p>
          )}

          {result && (
            <p className="text-sm text-green-600 dark:text-green-400">
              {result}
            </p>
          )}

          <div className="flex justify-end">
            <Button
              variant="primary"
              loading={submitting}
              disabled={!method || !targetType}
              onClick={handleSubmit}
            >
              Run
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
