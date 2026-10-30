"use client";

import { ChevronDown, Megaphone, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Markdown } from "@/components/markdown/Markdown";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
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
      {canEdit && (
        <div className="mb-5 flex items-center justify-between gap-3">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Updates shown on your bot's page and in the Feed.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPosting(true)}
          >
            <Plus size={12} />
            Post Update
          </Button>
        </div>
      )}

      {changelogs.length === 0 ? (
        <EmptyState icon={Megaphone} title="No updates posted yet" />
      ) : (
        <div className="space-y-4">
          {changelogs.map((entry) => (
            <ChangelogEntry
              key={entry.id}
              entry={entry}
              highlighted={entry.id === highlightId}
              canEdit={canEdit}
              deleting={deleting === entry.id}
              confirming={confirmDeleteId === entry.id}
              onDelete={() => handleDelete(entry.id)}
            />
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

const COLLAPSE_AT = 700;

function ChangelogEntry({
  entry,
  highlighted,
  canEdit,
  deleting,
  confirming,
  onDelete,
}: {
  entry: BotChangelog;
  highlighted: boolean;
  canEdit?: boolean;
  deleting: boolean;
  confirming: boolean;
  onDelete: () => void;
}) {
  const long = entry.content.length > COLLAPSE_AT;
  const [expanded, setExpanded] = useState(highlighted);

  return (
    <article
      id={`changelog-${entry.id}`}
      className={[
        "scroll-mt-24 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900",
        highlighted &&
          "ring-2 ring-accent ring-offset-2 dark:ring-offset-zinc-950",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <header className="flex items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-zinc-950 dark:text-zinc-50">
              {entry.title}
            </h3>
            {entry.version && <Badge variant="info">{entry.version}</Badge>}
          </div>
          <time
            dateTime={entry.created_at}
            title={new Date(entry.created_at).toLocaleString()}
            suppressHydrationWarning
            className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400"
          >
            {new Date(entry.created_at).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}{" "}
            · {formatRelativeTime(entry.created_at)}
          </time>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            aria-label="Delete update"
            className={[
              "flex h-8 shrink-0 items-center justify-center rounded-lg px-2 text-xs font-medium transition-colors disabled:opacity-50",
              confirming
                ? "bg-red-500/10 text-red-600 dark:text-red-400"
                : "w-8 text-zinc-400 hover:bg-zinc-100 hover:text-red-600 dark:hover:bg-zinc-800 dark:hover:text-red-400",
            ].join(" ")}
          >
            {confirming ? "Delete?" : <Trash2 size={14} />}
          </button>
        )}
      </header>
      <div className="relative px-5 py-4">
        <div
          className={long && !expanded ? "max-h-72 overflow-hidden" : undefined}
        >
          <Markdown
            content={entry.content}
            softBreaks={false}
            className="text-sm text-zinc-600 dark:text-zinc-300"
          />
        </div>
        {long && !expanded && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent dark:from-zinc-900" />
        )}
      </div>
      {long && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex w-full items-center justify-center gap-1 border-t border-zinc-100 py-2.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-accent dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800/40"
        >
          {expanded ? "Show less" : "Show full update"}
          <ChevronDown
            size={13}
            className={`transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      )}
    </article>
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
            What changed{" "}
            <span className="font-normal text-zinc-400 dark:text-zinc-500">
              (Markdown and HTML supported)
            </span>
          </label>
          <textarea
            id="changelog-content"
            rows={6}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="### Added&#10;- `/warn` and `/mute`&#10;&#10;### Fixed&#10;- The welcome message not sending"
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
