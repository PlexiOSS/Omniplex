"use client";

import { GitBranch, Minus, Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import type { ChangelogEntry, ChangelogProject } from "@/lib/api/types";
import { formatRelativeTime } from "@/lib/utils/format";

interface ChangelogListProps {
  entries: ChangelogEntry[];
}

const PROJECT_LABEL: Record<ChangelogProject, string> = {
  popplio: "Popplio",
  omniplex: "Omniplex",
};

const PROJECTS: ChangelogProject[] = ["popplio", "omniplex"];

export function ChangelogList({ entries }: ChangelogListProps) {
  const [activeProject, setActiveProject] = useState<ChangelogProject | null>(
    null,
  );

  const present = PROJECTS.filter((p) => entries.some((e) => e.project === p));
  const filtered = activeProject
    ? entries.filter((e) => e.project === activeProject)
    : entries;

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center text-zinc-500 dark:text-zinc-400">
        <GitBranch
          size={28}
          className="mb-3 text-zinc-300 dark:text-zinc-700"
        />
        <p className="text-sm">No changelog entries yet check back shortly.</p>
      </div>
    );
  }

  return (
    <div>
      {present.length > 1 && (
        <div className="mb-8 flex flex-wrap gap-1.5">
          <FilterTab
            active={activeProject === null}
            onClick={() => setActiveProject(null)}
          >
            All
          </FilterTab>
          {present.map((project) => (
            <FilterTab
              key={project}
              active={activeProject === project}
              onClick={() => setActiveProject(project)}
            >
              {PROJECT_LABEL[project]}
            </FilterTab>
          ))}
        </div>
      )}

      <div className="space-y-6">
        {filtered.map((entry) => (
          <ReleaseCard key={entry.itag} entry={entry} />
        ))}
      </div>
    </div>
  );
}

function ReleaseCard({ entry }: { entry: ChangelogEntry }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-zinc-100 bg-zinc-50/60 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900/40">
        <Badge variant="info">{PROJECT_LABEL[entry.project]}</Badge>
        <h2 className="min-w-0 flex-1 truncate text-base font-semibold text-zinc-950 dark:text-zinc-50">
          {entry.version}
        </h2>
        {entry.prerelease && <Badge variant="warning">Pre-release</Badge>}
        <span className="text-xs whitespace-nowrap text-zinc-400 dark:text-zinc-600">
          {formatRelativeTime(entry.created_at)}
        </span>
      </div>

      <div className="px-6 py-5">
        {entry.extra_description && (
          <p className="mb-4 text-sm text-zinc-700 dark:text-zinc-300">
            {entry.extra_description}
          </p>
        )}

        <div className="space-y-4">
          <ChangeGroup
            icon={Plus}
            label="Added"
            items={entry.added}
            tone="text-green-600 dark:text-green-400"
          />
          <ChangeGroup
            icon={Pencil}
            label="Updated"
            items={entry.updated}
            tone="text-blue-600 dark:text-blue-400"
          />
          <ChangeGroup
            icon={Minus}
            label="Removed"
            items={entry.removed}
            tone="text-red-600 dark:text-red-400"
          />
        </div>

        {entry.author && (
          <div className="mt-5 flex items-center justify-between gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <Avatar
                src={entry.author.avatar}
                alt={entry.author.username}
                size={18}
              />
              {entry.author.display_name || entry.author.username}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

function ChangeGroup({
  icon: Icon,
  label,
  items,
  tone,
}: {
  icon: typeof Plus;
  label: string;
  items: string[];
  tone: string;
}) {
  if (items.length === 0) return null;

  return (
    <div>
      <div
        className={`mb-1.5 flex items-center gap-1.5 text-xs font-semibold ${tone}`}
      >
        <Icon size={12} />
        {label}
      </div>
      <ul className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
        {items.map((item) => (
          <li key={item} className="pl-4">
            {item}
          </li>
        ))}
      </ul>
    </div>
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
