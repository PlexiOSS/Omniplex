"use client";

import { CircleCheck, CircleX } from "lucide-react";
import { useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { webhooks } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import type { WebhookTestMeta } from "@/lib/api/types";

type TargetType = "bot" | "server" | "team";

interface WebhookTestModalProps {
  targetType: TargetType;
  targetId: string;
  authToken: string;
  testMeta: WebhookTestMeta | null;
  onClose: () => void;
}

export function WebhookTestModal({
  targetType,
  targetId,
  authToken,
  testMeta,
  onClose,
}: WebhookTestModalProps) {
  const types = testMeta?.data ?? [];
  const [selectedType, setSelectedType] = useState(types[0]?.type ?? "");
  const [values, setValues] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<
    { ok: true } | { ok: false; message: string } | null
  >(null);

  const activeVars = useMemo(
    () => types.find((t) => t.type === selectedType)?.data ?? [],
    [types, selectedType],
  );

  function handleSelectType(type: string) {
    setSelectedType(type);
    setResult(null);
    const next: Record<string, string> = {};
    for (const v of types.find((t) => t.type === type)?.data ?? []) {
      next[v.id] = v.value;
    }
    setValues(next);
  }

  async function handleSend() {
    if (!selectedType) return;
    setSending(true);
    setResult(null);
    try {
      const payload: Record<string, unknown> = {};
      for (const v of activeVars) {
        const raw = values[v.id] ?? v.value;
        if (v.type === "number") payload[v.id] = Number(raw);
        else if (v.type === "boolean") payload[v.id] = raw === "true";
        else if (v.type === "text[]" || v.type === "link[]")
          payload[v.id] = raw
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        else payload[v.id] = raw;
      }
      await webhooks.sendTest(
        targetType,
        targetId,
        selectedType,
        payload,
        authToken,
      );
      setResult({ ok: true });
    } catch (err) {
      setResult({
        ok: false,
        message: err instanceof ApiError ? err.message : "Test send failed.",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Test Webhook">
      <div className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="webhook-test-event"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Event
          </label>
          <select
            id="webhook-test-event"
            value={selectedType}
            onChange={(e) => handleSelectType(e.target.value)}
            className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
          >
            {types.map((t) => (
              <option key={t.type} value={t.type}>
                {t.type}
              </option>
            ))}
          </select>
        </div>

        {activeVars.length > 0 && (
          <div className="space-y-3">
            {activeVars.map((v) => (
              <Input
                key={v.id}
                label={v.name}
                title={v.description}
                value={values[v.id] ?? v.value}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [v.id]: e.target.value }))
                }
                placeholder={
                  v.type === "text[]" || v.type === "link[]"
                    ? "comma,separated,values"
                    : undefined
                }
              />
            ))}
          </div>
        )}

        {result && (
          <p
            className={[
              "flex items-center gap-1.5 text-sm",
              result.ok
                ? "text-green-700 dark:text-green-400"
                : "text-red-700 dark:text-red-400",
            ].join(" ")}
          >
            {result.ok ? (
              <>
                <CircleCheck size={14} />
                Sent — check delivery logs for the outcome.
              </>
            ) : (
              <>
                <CircleX size={14} />
                {result.message}
              </>
            )}
          </p>
        )}

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="primary"
            size="sm"
            loading={sending}
            disabled={!selectedType}
            onClick={handleSend}
          >
            Send Test
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        <p className="text-xs text-zinc-400 dark:text-zinc-600">
          Limited to 3 test sends per minute.
        </p>
      </div>
    </Modal>
  );
}
