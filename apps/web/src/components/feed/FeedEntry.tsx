"use client";

import type {
  BotChangelogFeedEntry,
  ServerChangelogFeedEntry,
} from "@omniplex/core/api/types";
import { mirroredAvatarUrl } from "@omniplex/core/utils/assets";
import { formatRelativeTime } from "@omniplex/core/utils/format";
import { Avatar } from "@omniplex/ui/Avatar";
import { Badge } from "@omniplex/ui/Badge";
import { ListFilter } from "lucide-react";
import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { Markdown } from "@/components/markdown/Markdown";

const COLLAPSED_HEIGHT = 200;

export interface FeedItem {
  id: string;
  kind: "bot" | "server";
  entityId: string;
  name: string;
  avatar: string;
  title: string;
  content: string;
  version: string;
  created_at: string;
}

export function fromBotEntry(e: BotChangelogFeedEntry): FeedItem {
  return {
    id: e.id,
    kind: "bot",
    entityId: e.bot_id,
    name: e.user.username,
    avatar: mirroredAvatarUrl("bots", e.bot_id, e.user.avatar),
    title: e.title,
    content: e.content,
    version: e.version,
    created_at: e.created_at,
  };
}

export function fromServerEntry(e: ServerChangelogFeedEntry): FeedItem {
  return {
    id: e.id,
    kind: "server",
    entityId: e.server_id,
    name: e.name,
    avatar: e.avatar
      ? mirroredAvatarUrl("servers", e.server_id, e.avatar)
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(e.name)}&size=64&background=random`,
    title: e.title,
    content: e.content,
    version: e.version,
    created_at: e.created_at,
  };
}

interface FeedEntryProps {
  entry: FeedItem;
  filteredToBot: boolean;
  onFilterBot: (id: string) => void;
}

export function FeedEntry({
  entry,
  filteredToBot,
  onFilterBot,
}: FeedEntryProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);

  useLayoutEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const measure = () =>
      setOverflowing(el.scrollHeight > COLLAPSED_HEIGHT + 24);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const collapsed = overflowing && !expanded;

  return (
    <article className="min-w-0 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={`/${entry.kind}s/${entry.entityId}`}
          className="flex min-w-0 items-center gap-2.5"
        >
          <Avatar src={entry.avatar} alt={entry.name} size={28} />
          <span className="truncate text-sm font-medium text-zinc-950 transition-colors hover:text-accent dark:text-zinc-50">
            {entry.name}
          </span>
        </Link>
        {!filteredToBot && (
          <button
            type="button"
            onClick={() => onFilterBot(entry.entityId)}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <ListFilter size={13} />
            More from this {entry.kind}
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Link
          href={`/${entry.kind}s/${entry.entityId}?changelog=${entry.id}`}
          className="font-medium text-zinc-950 transition-colors hover:text-accent dark:text-zinc-50"
        >
          {entry.title}
        </Link>
        {entry.version && <Badge variant="info">{entry.version}</Badge>}
      </div>

      <div
        ref={bodyRef}
        className={[
          "mt-1 overflow-hidden",
          collapsed
            ? "[mask-image:linear-gradient(to_bottom,black_65%,transparent)]"
            : "",
        ].join(" ")}
        style={collapsed ? { maxHeight: COLLAPSED_HEIGHT } : undefined}
      >
        <Markdown
          content={entry.content}
          softBreaks={false}
          className="text-sm text-zinc-600 dark:text-zinc-300"
        />
      </div>

      <div className="mt-2 flex items-center gap-3 text-xs">
        <span className="text-zinc-400 dark:text-zinc-600">
          {formatRelativeTime(entry.created_at)}
        </span>
        {overflowing && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="font-medium text-accent hover:underline"
          >
            {expanded ? "Show less" : "Show more"}
          </button>
        )}
      </div>
    </article>
  );
}
