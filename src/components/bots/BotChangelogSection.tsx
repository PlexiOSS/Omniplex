"use client";

import { Megaphone, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useHighlightScroll } from "@/hooks/useHighlightScroll";
import { bots as botsApi } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import type { BotChangelog } from "@/lib/api/types";
import { formatRelativeTime } from "@/lib/utils/format";

interface BotChangelogSectionProps {
  botId: string;
  initialChangelogs: BotChangelog[];
  canEdit: boolean;
  token?: string;
  highlightId?: string;
}

export function BotChangelogSection({
  botId,
  initialChangelogs,
  canEdit,
  token,
  highlightId,
}: BotChangelogSectionProps) {
  const [changelogs, setChangelogs] = useState(initialChangelogs);
  const [posting, setPosting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useHighlightScroll(highlightId ? `changelog-${highlightId}` : undefined);

  function handleDelete(id: string) {
    if (!token) return;
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
      return;
    }
    setConfirmDeleteId(null);
    setDeleting(id);
    botsApi
      .deleteChangelog(botId, id, token)
      .then(() => setChangelogs((prev) => prev.filter((c) => c.id !== id)))
      .catch(() => {})
      .finally(() => setDeleting(null));
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
          Changelog
        </h2>
        {canEdit && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPosting(true)}
          >
            <Plus size={12} />
            Post Update
          </Button>
        )}
      </div>

      {changelogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Megaphone
            size={28}
            className="mb-3 text-zinc-300 dark:text-zinc-700"
          />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No updates posted yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {changelogs.map((entry) => (
            <div
              key={entry.id}
              id={`changelog-${entry.id}`}
              className={[
                "scroll-mt-24 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800",
                entry.id === highlightId &&
                  "ring-2 ring-accent ring-offset-2 dark:ring-offset-zinc-950",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-zinc-950 dark:text-zinc-50">
                    {entry.title}
                  </p>
                  {entry.version && (
                    <Badge variant="info">{entry.version}</Badge>
                  )}
                </div>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => handleDelete(entry.id)}
                    disabled={deleting === entry.id}
                    aria-label="Delete update"
                    className={[
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors disabled:opacity-50",
                      confirmDeleteId === entry.id
                        ? "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400"
                        : "text-zinc-400 hover:bg-zinc-100 hover:text-red-600 dark:hover:bg-zinc-800 dark:hover:text-red-400",
                    ].join(" ")}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-300">
                {entry.content}
              </p>
              <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-600">
                {formatRelativeTime(entry.created_at)}
              </p>
            </div>
          ))}
        </div>
      )}

      {posting && token && (
        <PostChangelogModal
          botId={botId}
          token={token}
          onClose={() => setPosting(false)}
          onPosted={(entry) => setChangelogs((prev) => [entry, ...prev])}
        />
      )}
    </div>
  );
}

function PostChangelogModal({
  botId,
  token,
  onClose,
  onPosted,
}: {
  botId: string;
  token: string;
  onClose: () => void;
  onPosted: (entry: BotChangelog) => void;
}) {
  const [title, setTitle] = useState("");
  const [version, setVersion] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const entry = await botsApi.createChangelog(
        botId,
        {
          title: title.trim(),
          content: content.trim(),
          version: version.trim(),
        },
        token,
      );
      onPosted(entry);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to post.");
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Post an Update">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            id="changelog-title"
            label="Title"
            placeholder="New moderation commands"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <Input
            id="changelog-version"
            label="Version (optional)"
            placeholder="v2.4.0"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="changelog-content"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            What changed
          </label>
          <textarea
            id="changelog-content"
            rows={6}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="- Added /warn and /mute&#10;- Fixed the welcome message not sending"
            className="w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-400 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600"
            required
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" loading={saving} onClick={handleSave}>
            Post
          </Button>
        </div>
      </div>
    </Modal>
  );
}
