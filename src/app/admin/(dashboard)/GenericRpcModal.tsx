"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type {
  RPCField,
  RPCMethod,
  RPCWebAction,
  TargetType,
} from "@/lib/arcadia/types";

interface GenericRpcModalProps {
  loginToken: string;
  targetType: TargetType;
  targetId: string;
  entityLabel: string;
  /** Should already be filtered to methods supporting this target type and that the user has perms for. */
  methods: RPCWebAction[];
  onClose: () => void;
  onDone: (resultMessage: string | null) => void;
}

function fieldInput(
  field: RPCField,
  value: string | number | boolean,
  onChange: (v: string | number | boolean) => void,
) {
  if (field.field_type === "Boolean") {
    return (
      <label key={field.id} className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded border-zinc-300 accent-accent dark:border-zinc-700"
        />
        <span className="text-sm text-zinc-700 dark:text-zinc-300">
          {field.label}
        </span>
      </label>
    );
  }

  if (field.field_type === "Textarea") {
    return (
      <div key={field.id} className="flex flex-col gap-1.5">
        <label
          htmlFor={`rpc-${field.id}`}
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          {field.label}
        </label>
        <textarea
          id={`rpc-${field.id}`}
          rows={3}
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-400 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600"
        />
      </div>
    );
  }

  const inputType =
    field.field_type === "Number" || field.field_type === "Hour"
      ? "number"
      : "text";

  return (
    <Input
      key={field.id}
      id={`rpc-${field.id}`}
      label={field.label}
      type={inputType}
      placeholder={field.placeholder}
      value={value as string | number}
      onChange={(e) =>
        onChange(
          inputType === "number" ? Number(e.target.value) : e.target.value,
        )
      }
    />
  );
}

export function GenericRpcModal({
  loginToken,
  targetType,
  targetId,
  entityLabel,
  methods,
  onClose,
  onDone,
}: GenericRpcModalProps) {
  const [methodId, setMethodId] = useState(methods[0]?.id ?? "");
  const method = useMemo(
    () => methods.find((m) => m.id === methodId),
    [methods, methodId],
  );
  // target_id is always one of the fields per RPCField::target_id() — we
  // already know it from context, so it's excluded from the rendered form.
  const visibleFields = useMemo(
    () => (method?.fields ?? []).filter((f) => f.id !== "target_id"),
    [method],
  );

  const [values, setValues] = useState<
    Record<string, string | number | boolean>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setField(id: string, v: string | number | boolean) {
    setValues((prev) => ({ ...prev, [id]: v }));
  }

  async function handleSubmit() {
    if (!method) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = { target_id: targetId };
      for (const field of visibleFields) {
        payload[field.id] =
          field.field_type === "Boolean"
            ? !!values[field.id]
            : field.field_type === "Number" || field.field_type === "Hour"
              ? Number(values[field.id] ?? 0)
              : (values[field.id] ?? "");
      }

      const rpcMethod = { [method.id]: payload } as unknown as RPCMethod;
      const result = await arcadia.executeRpc(
        loginToken,
        targetType,
        rpcMethod,
      );
      onDone(result);
      onClose();
    } catch (err) {
      setError(err instanceof ArcadiaError ? err.message : "Action failed.");
      setSubmitting(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={`Actions — ${entityLabel}`}>
      <div className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="rpc-method"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Action
          </label>
          <select
            id="rpc-method"
            value={methodId}
            onChange={(e) => {
              setMethodId(e.target.value);
              setValues({});
            }}
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

        {visibleFields.map((field) =>
          fieldInput(
            field,
            values[field.id] ?? (field.field_type === "Boolean" ? false : ""),
            (v) => setField(field.id, v),
          ),
        )}

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" loading={submitting} onClick={handleSubmit}>
            Run
          </Button>
        </div>
      </div>
    </Modal>
  );
}
