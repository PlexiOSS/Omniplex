"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ArcadiaError } from "@/lib/arcadia/client";

interface ReasonTemplate {
  id: string;
  name: string;
  description: string;
}

interface RpcActionModalProps {
  title: string;
  /** If set, shows a required reason textarea and passes it to onSubmit. */
  needsReason?: boolean;
  /** Canned reasons offered as a quick-fill above the textarea, if any apply. */
  templates?: ReasonTemplate[];
  confirmLabel?: string;
  danger?: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
}

export function RpcActionModal({
  title,
  needsReason = true,
  templates,
  confirmLabel = "Confirm",
  danger = false,
  onClose,
  onSubmit,
}: RpcActionModalProps) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (needsReason && !reason.trim()) {
      setError("A reason is required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(reason.trim());
      onClose();
    } catch (err) {
      setError(err instanceof ArcadiaError ? err.message : "Action failed.");
      setSubmitting(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={title}>
      <div className="space-y-4">
        {needsReason && templates && templates.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="rpc-reason-template"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Quick-fill from a template
            </label>
            <select
              id="rpc-reason-template"
              defaultValue=""
              onChange={(e) => {
                const template = templates.find((t) => t.id === e.target.value);
                if (template) setReason(template.description);
                e.target.value = "";
              }}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
            >
              <option value="" disabled>
                Choose a template…
              </option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {needsReason && (
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="rpc-reason"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Reason
            </label>
            <textarea
              id="rpc-reason"
              rows={3}
              maxLength={2000}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
            />
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            loading={submitting}
            onClick={handleSubmit}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
