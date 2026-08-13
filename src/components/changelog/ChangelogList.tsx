"use client";

import { ChevronDown, ExternalLink, GitBranch, Tag } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Markdown } from "@/components/markdown/Markdown";
import type { ChangelogRepo } from "@/lib/github/config";
import type { ChangelogEntry } from "@/lib/github/releases";
import { formatRelativeTime } from "@/lib/utils/format";

interface ChangelogListProps {
  entries: ChangelogEntry[];
  repos: ChangelogRepo[];
}

export function ChangelogList({ entries, repos }: ChangelogListProps) {
  const [activeRepo, setActiveRepo] = useState<string | null>(null);

  const filtered = activeRepo
    ? entries.filter((e) => e.source.repo === activeRepo)
    : entries;

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center text-zinc-500 dark:text-zinc-400">
        <GitBranch size={28} className="mb-3 text-zinc-300 dark:text-zinc-700" />
        <p className="text-sm">
          Couldn&apos;t load releases from GitHub right now — check back
          shortly.
        </p>
      </div>
    );
  }

  return (
    <div>
      {repos.length > 1 && (
        <div className="mb-8 flex flex-wrap gap-1.5">
          <FilterTab
            active={activeRepo === null}
            onClick={() => setActiveRepo(null)}
          >
            All
          </FilterTab>
          {repos.map((repo) => (
            <FilterTab
              key={repo.repo}
              active={activeRepo === repo.repo}
              onClick={() => setActiveRepo(repo.repo)}
            >
              {repo.label}
            </FilterTab>
          ))}
        </div>
      )}

      <div className="space-y-6">
        {filtered.map((entry) => (
          <ReleaseCard key={`${entry.source.repo}-${entry.id}`} entry={entry} />
        ))}
      </div>
    </div>
  );
}

const COLLAPSED_HEIGHT = 240;

function ReleaseCard({ entry }: { entry: ChangelogEntry }) {
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = bodyRef.current;
    if (el) setOverflowing(el.scrollHeight > COLLAPSED_HEIGHT + 8);
  }, []);

  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-zinc-100 bg-zinc-50/60 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900/40">
        <Badge variant="info">{entry.source.label}</Badge>
        <h2 className="min-w-0 flex-1 truncate text-base font-semibold text-zinc-950 dark:text-zinc-50">
          {entry.name || entry.tag_name}
        </h2>
        {entry.prerelease && <Badge variant="warning">Pre-release</Badge>}
        <span className="inline-flex items-center gap-1 text-xs text-zinc-400 dark:text-zinc-600">
          <Tag size={11} />
          {entry.tag_name}
        </span>
        {entry.published_at && (
          <span className="text-xs whitespace-nowrap text-zinc-400 dark:text-zinc-600">
            {formatRelativeTime(entry.published_at)}
          </span>
        )}
      </div>

      <div className="px-6 py-5">
        {entry.body && (
          <div className="relative">
            <div
              ref={bodyRef}
              style={
                !expanded && overflowing
                  ? { maxHeight: COLLAPSED_HEIGHT, overflow: "hidden" }
                  : undefined
              }
            >
              <Markdown
                content={entry.body}
                className="text-sm text-zinc-700 dark:text-zinc-300"
              />
            </div>
            {!expanded && overflowing && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent dark:from-zinc-950" />
            )}
          </div>
        )}

        {overflowing && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-3 flex items-center gap-1 text-xs font-medium text-accent hover:underline"
          >
            {expanded ? "Show less" : "Show full release notes"}
            <ChevronDown
              size={12}
              className={expanded ? "rotate-180 transition-transform" : "transition-transform"}
            />
          </button>
        )}

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <a
            href={entry.author.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-zinc-500 transition-colors hover:text-accent dark:text-zinc-400"
          >
            <Avatar src={entry.author.avatar_url} alt={entry.author.login} size={18} />
            {entry.author.login}
          </a>
          <a
            href={entry.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-accent dark:text-zinc-400"
          >
            View on GitHub
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </article>
  );
}

function FilterTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-accent/10 text-accent"
          : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
