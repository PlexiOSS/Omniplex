"use client";

import { ExternalLink, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type { BotWhitelist } from "@/lib/arcadia/types";
import { formatRelativeTime } from "@/lib/utils/format";
import { useAdmin } from "../../../AdminContext";
import { AdminPageHeader } from "../../../AdminPageHeader";
import { BotWhitelistEditModal } from "./BotWhitelistEditModal";

export default function BotWhitelistPage() {
  const { loginToken, hasPerm } = useAdmin();

  const [entries, setEntries] = useState<BotWhitelist[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<BotWhitelist | "new" | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const confirmRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    try {
      setEntries(await arcadia.botWhitelist.list(loginToken));
    } catch (err) {
      setError(
        err instanceof ArcadiaError
          ? err.message
          : "Failed to load the whitelist.",
      );
    }
  }, [loginToken]);

  useEffect(() => {
    load();
  }, [load]);

  function handleDeleteClick(botId: string) {
    if (confirmDeleteId !== botId) {
      setConfirmDeleteId(botId);
      confirmRef.current = setTimeout(() => setConfirmDeleteId(null), 3000);
      return;
    }
    if (confirmRef.current) clearTimeout(confirmRef.current);
    setConfirmDeleteId(null);
    setDeleting(botId);
    arcadia.botWhitelist
      .delete(loginToken, botId)
      .then(load)
      .catch((err) =>
        setError(
          err instanceof ArcadiaError ? err.message : "Failed to delete.",
        ),
      )
      .finally(() => setDeleting(null));
  }

  if (error && !entries) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!entries) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-50" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <AdminPageHeader
        title="Bot Whitelist"
        description="Bots allowed past a restriction they'd otherwise hit for shop purchases."
        action={
          hasPerm("manage_bot_whitelist") && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setEditing("new")}
            >
              <Plus size={14} />
              Whitelist Bot
            </Button>
          )
        }
      />

      {error && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="mt-6 space-y-2">
        {entries.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No bots are whitelisted.
          </p>
        )}
        {entries.map((entry) => (
          <div
            key={entry.bot_id}
            className="flex items-center gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <a
                  href={`/bots/${entry.bot_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 font-mono text-sm font-semibold text-zinc-950 hover:text-accent dark:text-zinc-50"
                >
                  {entry.bot_id}
                  <ExternalLink size={11} className="shrink-0" />
                </a>
              </div>
              <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                {entry.reason}
              </p>
              <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-600">
                Added by {entry.user_id} ·{" "}
                {formatRelativeTime(entry.created_at)}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {hasPerm("manage_bot_whitelist") && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditing(entry)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant={
                      confirmDeleteId === entry.bot_id ? "danger" : "ghost"
                    }
                    size="sm"
                    loading={deleting === entry.bot_id}
                    onClick={() => handleDeleteClick(entry.bot_id)}
                  >
                    <Trash2 size={12} />
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {editing === "new" && (
        <BotWhitelistEditModal
          loginToken={loginToken}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}
      {editing && editing !== "new" && (
        <BotWhitelistEditModal
          loginToken={loginToken}
          entry={editing}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
