"use client";

import { SITE_URL } from "@omniplex/core/api/config";
import { formatRelativeTime } from "@omniplex/core/utils/format";
import { Avatar } from "@omniplex/ui/Avatar";
import { Button } from "@omniplex/ui/Button";
import { Check, ExternalLink, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAdmin } from "@/app/AdminContext";
import { AdminPageHeader } from "@/app/AdminPageHeader";
import { AdminEmptyState } from "@/components/admin/AdminListRow";
import { AdminError, AdminLoading } from "@/components/admin/AdminState";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type { PendingPageImage } from "@/lib/arcadia/types";

const POSITIONS = {
  top: "center top",
  center: "center",
  bottom: "center bottom",
};

const QUICK_REASONS = [
  "Contains NSFW or suggestive content.",
  "Contains someone else's artwork or branding.",
  "Too busy to read text over. Try something calmer or turn up the fade.",
  "Low quality or heavily stretched.",
];

function Preview({ item, url }: { item: PendingPageImage; url: string }) {
  return (
    <div className="relative h-44 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-950 dark:border-zinc-800">
      <div
        className="absolute inset-0 bg-cover"
        style={{
          backgroundImage: `url("${url}")`,
          backgroundPosition: POSITIONS[item.image_position],
          filter: item.blur ? `blur(${item.blur}px)` : undefined,
          transform: item.blur ? "scale(1.06)" : undefined,
        }}
      />
      <div
        className="absolute inset-0 bg-zinc-950"
        style={{ opacity: item.dim / 100 }}
      />
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 p-3">
        {item.avatar && <Avatar src={item.avatar} alt="" size={28} />}
        <span className="truncate text-sm font-semibold text-white">
          {item.name}
        </span>
      </div>
    </div>
  );
}

export default function BackgroundsPage() {
  const { loginToken, hasPerm } = useAdmin();
  const [items, setItems] = useState<PendingPageImage[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setItems(await arcadia.pageStyles.listPending(loginToken));
    } catch (err) {
      setError(
        err instanceof ArcadiaError
          ? err.message
          : "Failed to load backgrounds.",
      );
    }
  }, [loginToken]);

  useEffect(() => {
    load();
  }, [load]);

  async function decide(item: PendingPageImage, approve: boolean) {
    const key = `${item.target_type}:${item.target_id}`;
    setBusy(key);
    setActionError(null);
    const decision = {
      target_type: item.target_type,
      target_id: item.target_id,
      version: item.version,
      reason: approve ? "" : reason,
    };
    try {
      if (approve) await arcadia.pageStyles.approve(loginToken, decision);
      else await arcadia.pageStyles.reject(loginToken, decision);
      setRejecting(null);
      setReason("");
      await load();
    } catch (err) {
      setActionError(
        err instanceof ArcadiaError ? err.message : "That didn't go through.",
      );
    } finally {
      setBusy(null);
    }
  }

  if (!hasPerm("review_entities")) {
    return (
      <AdminError message="You need the Review Entities permission to review backgrounds." />
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Backgrounds"
        description="Custom page backgrounds waiting for review. They only show on the listing once approved, and owners are told either way."
      />

      {error ? (
        <AdminError message={error} />
      ) : !items ? (
        <AdminLoading />
      ) : items.length === 0 ? (
        <AdminEmptyState message="No backgrounds waiting for review." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((item) => {
            const key = `${item.target_type}:${item.target_id}`;
            return (
              <div
                key={key}
                className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <Preview item={item} url={item.image_url} />
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <span>
                    {item.target_type === "bot" ? "Bot" : "Server"} · uploaded{" "}
                    {formatRelativeTime(item.pending_since)}
                    {item.replaces_url && " · replaces a live background"}
                  </span>
                  <span className="flex items-center gap-3">
                    <a
                      href={item.image_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 hover:text-accent"
                    >
                      Full image <ExternalLink size={11} />
                    </a>
                    <a
                      href={`${SITE_URL}/${item.target_type}s/${item.target_id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 hover:text-accent"
                    >
                      Listing <ExternalLink size={11} />
                    </a>
                  </span>
                </div>

                {rejecting === key ? (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_REASONS.map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setReason(r)}
                          className="rounded-full border border-zinc-200 px-2.5 py-1 text-[11px] text-zinc-600 hover:border-accent/40 hover:text-accent dark:border-zinc-700 dark:text-zinc-300"
                        >
                          {r.split(".")[0]}
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={2}
                      maxLength={300}
                      placeholder="Tell the owner what to change (they see this)"
                      className="w-full resize-none rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-accent/50 dark:border-zinc-700 dark:bg-zinc-950"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setRejecting(null);
                          setReason("");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        loading={busy === key}
                        disabled={reason.trim().length < 5}
                        onClick={() => decide(item, false)}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={busy !== null}
                      onClick={() => {
                        setRejecting(key);
                        setReason("");
                      }}
                    >
                      <X size={14} />
                      Reject
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      loading={busy === key}
                      disabled={busy !== null && busy !== key}
                      onClick={() => decide(item, true)}
                    >
                      <Check size={14} />
                      Approve
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {actionError && (
        <p className="text-sm text-red-600 dark:text-red-400">{actionError}</p>
      )}
    </div>
  );
}
