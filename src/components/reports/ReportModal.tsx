"use client";

import { Flag } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SignInLink } from "@/components/ui/SignInLink";
import { useAuth } from "@/hooks/useAuth";
import { reports } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import type { ReportReason, TargetType } from "@/lib/api/types";

interface ReportModalProps {
  targetType: TargetType;
  targetId: string;
  /** What's shown in the trigger button and confirmation copy, e.g. "bot", "server", "pack". */
  targetLabel: string;
}

const REASONS: { value: ReportReason; label: string }[] = [
  { value: "license_violation", label: "License violation" },
  { value: "tos_violation", label: "Terms of Service violation" },
  { value: "spam", label: "Spam" },
  { value: "other", label: "Other" },
];

/**
 * Generic "report this" trigger + modal, usable on any votable entity —
 * built for packs (license-violation reports on emoji/server packs) but
 * deliberately not pack-specific, so bots/servers can adopt it later
 * without a new component.
 */
export function ReportModal({
  targetType,
  targetId,
  targetLabel,
}: ReportModalProps) {
  const { session, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("license_violation");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!isAuthenticated) {
    return (
      <SignInLink className="inline-flex items-center gap-1.5 text-xs text-zinc-400 transition-colors hover:text-zinc-700 dark:text-zinc-600 dark:hover:text-zinc-300">
        <Flag size={12} />
        Report this {targetLabel}
      </SignInLink>
    );
  }

  async function handleSubmit() {
    if (!session || description.trim().length < 10) {
      setError("Please add at least 10 characters of detail.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await reports.createReport(
        targetType,
        targetId,
        session.user_id,
        { reason, description: description.trim() },
        session.token,
      );
      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to file report.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    setOpen(false);
    // Reset after the close animation-adjacent tick rather than mid-modal,
    // so the success state doesn't flash-reset while still visible.
    setTimeout(() => {
      setSubmitted(false);
      setDescription("");
      setReason("license_violation");
      setError(null);
    }, 200);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs text-zinc-400 transition-colors hover:text-zinc-700 dark:text-zinc-600 dark:hover:text-zinc-300"
      >
        <Flag size={12} />
        Report this {targetLabel}
      </button>

      <Modal open={open} onClose={handleClose} title={`Report this ${targetLabel}`}>
        {submitted ? (
          <div className="text-center">
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              Thanks — this has been sent to our staff for review.
            </p>
            <Button
              variant="secondary"
              onClick={handleClose}
              className="mt-4"
            >
              Close
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="mb-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Reason
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {REASONS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setReason(r.value)}
                    className={[
                      "rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors",
                      reason === r.value
                        ? "border-accent bg-accent/5 text-accent"
                        : "border-zinc-200 text-zinc-600 hover:border-accent/40 hover:bg-accent/5 dark:border-zinc-800 dark:text-zinc-400",
                    ].join(" ")}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="report-description"
                className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Details
              </label>
              <textarea
                id="report-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="What happened? Include anything staff would need to verify this."
                className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-400 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600"
              />
              <p className="mt-1 text-right text-xs text-zinc-400">
                {description.length}/500
              </p>
            </div>

            {error && (
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleSubmit} loading={submitting}>
                Submit Report
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
