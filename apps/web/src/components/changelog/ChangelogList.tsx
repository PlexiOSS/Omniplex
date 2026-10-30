"use client";

import {
  ChevronDown,
  GitBranch,
  Link2,
  Minus,
  Pencil,
  Plus,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Markdown } from "@/components/markdown/Markdown";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import type { ChangelogEntry } from "@/lib/api/types";
import {
  CHANGELOG_PROJECTS,
  type ChangelogTrack,
  changelogLabel,
  packageLabel,
  trackKey,
} from "@/lib/changelog";
import { formatRelativeTime } from "@/lib/utils/format";

/**
 * Turns a plain-text list into a GFM bullet list source string, escaping
 * each item's leading markdown-list-marker-lookalikes (-, *, +, digit+.) so
 * an item that happens to start with one of those doesn't get misread as
 * its own nested list syntax by the markdown parser.
 */
function toBulletMarkdown(items: string[]): string {
  return items
    .map((item) => `- ${item.replace(/^([-*+]|\d+\.)\s/, "\\$1 ")}`)
    .join("\n");
}

interface ChangelogListProps {
  entries: ChangelogEntry[];
  activeTrack: string | null;
}

function tracksIn(entries: ChangelogEntry[]): ChangelogTrack[] {
  const seen = new Map<string, ChangelogTrack>();
  for (const e of entries) {
    seen.set(trackKey(e), { project: e.project, package: e.package ?? null });
  }
  return [...seen.values()].sort(
    (a, b) =>
      CHANGELOG_PROJECTS.indexOf(a.project) -
        CHANGELOG_PROJECTS.indexOf(b.project) ||
      (a.package === null ? -1 : b.package === null ? 1 : 0) ||
      packageLabel(a.package ?? "").localeCompare(
        packageLabel(b.package ?? ""),
      ),
  );
}

function trackHref(track: ChangelogTrack): string {
  const params = new URLSearchParams({ project: track.project });
  if (track.package) params.set("package", track.package);
  return `/changelog?${params}`;
}

const GROUPS = [
  {
    key: "added",
    icon: Plus,
    label: "Added",
    tone: "text-green-600 dark:text-green-400",
  },
  {
    key: "updated",
    icon: Pencil,
    label: "Updated",
    tone: "text-blue-600 dark:text-blue-400",
  },
  {
    key: "fixed",
    icon: Wrench,
    label: "Fixed",
    tone: "text-amber-600 dark:text-amber-400",
  },
  {
    key: "removed",
    icon: Minus,
    label: "Removed",
    tone: "text-red-600 dark:text-red-400",
  },
  {
    key: "security",
    icon: ShieldCheck,
    label: "Security",
    tone: "text-violet-600 dark:text-violet-400",
  },
] as const;

function itemsFor(entry: ChangelogEntry, key: (typeof GROUPS)[number]["key"]) {
  return (key === "security" ? entry.security : entry[key]) ?? [];
}

function releaseAnchor(entry: ChangelogEntry): string {
  return `${trackKey(entry)}-${entry.version}`
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-");
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ChangelogList({ entries, activeTrack }: ChangelogListProps) {
  const present = tracksIn(entries);
  const active = present.some((t) => trackKey(t) === activeTrack)
    ? activeTrack
    : null;
  const filtered = active
    ? entries.filter((e) => trackKey(e) === active)
    : entries;

  const latestPerTrack = new Set(
    present
      .map((t) => filtered.find((e) => trackKey(e) === trackKey(t))?.itag)
      .filter((itag): itag is string => !!itag),
  );
  const [expanded, setExpanded] = useState<Set<string>>(latestPerTrack);

  useEffect(() => {
    function openFromHash() {
      const anchor = decodeURIComponent(window.location.hash.slice(1));
      if (!anchor) return;
      const target = entries.find((e) => releaseAnchor(e) === anchor);
      if (!target) return;
      setExpanded((prev) => new Set(prev).add(target.itag));
      requestAnimationFrame(() =>
        document.getElementById(anchor)?.scrollIntoView({ block: "start" }),
      );
    }
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, [entries]);

  function toggle(itag: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(itag)) next.delete(itag);
      else next.add(itag);
      return next;
    });
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center text-zinc-500 dark:text-zinc-400">
        <GitBranch
          size={28}
          className="mb-3 text-zinc-300 dark:text-zinc-700"
        />
        <p className="text-sm">No changelog entries yet. Check back shortly.</p>
      </div>
    );
  }

  return (
    <div>
      {present.length > 1 && (
        <div className="mb-8 flex flex-wrap gap-1.5">
          <FilterTab href="/changelog" active={active === null}>
            All
          </FilterTab>
          {present.map((track) => (
            <FilterTab
              key={trackKey(track)}
              href={trackHref(track)}
              active={active === trackKey(track)}
            >
              {track.package
                ? packageLabel(track.package)
                : changelogLabel(track.project)}
            </FilterTab>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_14rem]">
        <div className="min-w-0 space-y-6">
          {filtered.map((entry) => (
            <ReleaseCard
              key={entry.itag}
              entry={entry}
              open={expanded.has(entry.itag)}
              onToggle={() => toggle(entry.itag)}
            />
          ))}
        </div>

        <aside className="hidden lg:block">
          <nav className="sticky top-24 max-h-[calc(100vh-8rem)] space-y-6 overflow-y-auto">
            {present
              .filter((t) => filtered.some((e) => trackKey(e) === trackKey(t)))
              .map((track) => (
                <div key={trackKey(track)}>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                    {changelogLabel(track.project, track.package)}
                  </p>
                  <ul className="space-y-0.5">
                    {filtered
                      .filter((e) => trackKey(e) === trackKey(track))
                      .map((entry) => (
                        <li key={entry.itag}>
                          <a
                            href={`#${releaseAnchor(entry)}`}
                            className="flex items-baseline justify-between gap-2 rounded-md px-2 py-1 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                          >
                            <span className="truncate font-medium">
                              {entry.version}
                            </span>
                            <span
                              className="shrink-0 text-xs text-zinc-400 dark:text-zinc-500"
                              suppressHydrationWarning
                            >
                              {formatDate(entry.created_at)}
                            </span>
                          </a>
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
          </nav>
        </aside>
      </div>
    </div>
  );
}

function ReleaseCard({
  entry,
  open,
  onToggle,
}: {
  entry: ChangelogEntry;
  open: boolean;
  onToggle: () => void;
}) {
  const anchor = releaseAnchor(entry);
  const counts = GROUPS.map((g) => ({
    label: g.label.toLowerCase(),
    n: itemsFor(entry, g.key).length,
  })).filter((c) => c.n > 0);

  return (
    <article
      id={anchor}
      className="scroll-mt-24 overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-zinc-100 bg-zinc-50/60 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900/40">
        <Badge variant="info">
          {changelogLabel(entry.project, entry.package)}
        </Badge>
        <h2 className="min-w-0 flex-1 truncate text-base font-semibold text-zinc-950 dark:text-zinc-50">
          <a
            href={`#${anchor}`}
            className="group inline-flex items-center gap-1.5"
          >
            {entry.version}
            <Link2
              size={13}
              className="text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100"
            />
          </a>
        </h2>
        {entry.prerelease && <Badge variant="warning">Pre-release</Badge>}
        <time
          dateTime={entry.created_at}
          className="text-xs whitespace-nowrap text-zinc-400 dark:text-zinc-500"
          suppressHydrationWarning
        >
          {formatDate(entry.created_at)} ·{" "}
          {formatRelativeTime(entry.created_at)}
        </time>
      </div>

      <div className="px-6 py-5">
        {entry.extra_description && (
          <Markdown
            content={entry.extra_description}
            className="mb-4 text-sm text-zinc-700 dark:text-zinc-300"
          />
        )}

        {open ? (
          <div className="space-y-4">
            {GROUPS.map((g) => (
              <ChangeGroup
                key={g.key}
                icon={g.icon}
                label={g.label}
                items={itemsFor(entry, g.key)}
                tone={g.tone}
              />
            ))}
          </div>
        ) : (
          counts.length > 0 && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {counts.map((c) => `${c.n} ${c.label}`).join(" · ")}
            </p>
          )
        )}

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          {entry.author ? (
            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <Avatar
                src={entry.author.avatar}
                alt={entry.author.username}
                size={18}
              />
              {entry.author.display_name || entry.author.username}
            </div>
          ) : (
            <span />
          )}
          {counts.length > 0 && (
            <button
              type="button"
              onClick={onToggle}
              aria-expanded={open}
              className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 transition-colors hover:text-accent dark:text-zinc-400"
            >
              {open ? "Hide changes" : "Show changes"}
              <ChevronDown
                size={13}
                className={
                  open
                    ? "rotate-180 transition-transform"
                    : "transition-transform"
                }
              />
            </button>
          )}
        </div>
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
      <Markdown
        content={toBulletMarkdown(items)}
        className="text-sm text-zinc-700 dark:text-zinc-300"
      />
    </div>
  );
}

function FilterTab({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      className={[
        "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-accent/10 text-accent"
          : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}
