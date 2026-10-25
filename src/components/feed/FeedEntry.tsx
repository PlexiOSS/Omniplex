"use client";

import { ListFilter } from "lucide-react";
import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { Markdown } from "@/components/markdown/Markdown";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import type { BotChangelogFeedEntry } from "@/lib/api/types";
import { mirroredAvatarUrl } from "@/lib/utils/assets";
import { formatRelativeTime } from "@/lib/utils/format";

const COLLAPSED_HEIGHT = 200;

interface FeedEntryProps {
  entry: BotChangelogFeedEntry;
  filteredToBot: boolean;
  onFilterBot: (botId: string) => void;
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
    <article className="min-w-0 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={`/bots/${entry.bot_id}`}
          className="flex min-w-0 items-center gap-2.5"
        >
          <Avatar
            src={mirroredAvatarUrl("bots", entry.bot_id, entry.user.avatar)}
            alt={entry.user.username}
            size={28}
          />
          <span className="truncate text-sm font-medium text-zinc-950 transition-colors hover:text-accent dark:text-zinc-50">
            {entry.user.username}
          </span>
        </Link>
        {!filteredToBot && (
          <button
            type="button"
            onClick={() => onFilterBot(entry.bot_id)}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <ListFilter size={13} />
            More from this bot
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Link
          href={`/bots/${entry.bot_id}?changelog=${entry.id}`}
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
