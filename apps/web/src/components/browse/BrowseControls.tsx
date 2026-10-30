import { BadgeCheck, Search, X } from "lucide-react";
import Link from "next/link";

interface BrowseState {
  sort: string;
  tag: string;
  certified: boolean;
}

interface BrowseControlsProps {
  basePath: string;
  state: BrowseState;
  defaultSort: string;
  sorts: { value: string; label: string }[];
  tags: string[];
  searchLabel: string;
}

export function browseHref(
  basePath: string,
  state: BrowseState,
  defaultSort: string,
  changes: Partial<BrowseState>,
): string {
  const next = { ...state, ...changes };
  const params = new URLSearchParams();
  if (next.sort && next.sort !== defaultSort) params.set("sort", next.sort);
  if (next.tag) params.set("tag", next.tag);
  if (next.certified) params.set("certified", "true");
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

const chipBase =
  "rounded-full border px-3 py-1 text-xs font-medium transition-colors";
const chipIdle =
  "border-zinc-200 bg-white text-zinc-600 hover:border-accent/40 hover:text-accent dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300";
const chipActive = "border-accent/40 bg-accent/10 text-accent";

export function BrowseControls({
  basePath,
  state,
  defaultSort,
  sorts,
  tags,
  searchLabel,
}: BrowseControlsProps) {
  const href = (changes: Partial<BrowseState>) =>
    browseHref(basePath, state, defaultSort, changes);
  const knownTag = tags.some(
    (t) => t.toLowerCase() === state.tag.toLowerCase(),
  );

  return (
    <div className="mb-8 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex overflow-x-auto overflow-y-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
          {sorts.map((opt) => (
            <Link
              key={opt.value}
              href={href({ sort: opt.value })}
              scroll={false}
              className={[
                "shrink-0 px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                state.sort === opt.value
                  ? "bg-accent/10 text-accent"
                  : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800",
              ].join(" ")}
            >
              {opt.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={href({ certified: !state.certified })}
            scroll={false}
            className={[
              "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
              state.certified
                ? "border-accent/40 bg-accent/10 text-accent"
                : "border-zinc-200 text-zinc-500 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-50",
            ].join(" ")}
          >
            <BadgeCheck size={14} />
            Certified only
          </Link>
          <Link
            href={`/search?type=${basePath === "/servers" ? "server" : "bot"}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            <Search size={14} />
            {searchLabel}
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={href({ tag: "" })}
          scroll={false}
          className={[chipBase, state.tag ? chipIdle : chipActive].join(" ")}
        >
          All
        </Link>
        {tags.map((tag) => {
          const active = state.tag.toLowerCase() === tag.toLowerCase();
          return (
            <Link
              key={tag}
              href={href({ tag: active ? "" : tag })}
              scroll={false}
              className={[chipBase, active ? chipActive : chipIdle].join(" ")}
            >
              {tag}
            </Link>
          );
        })}
        {state.tag && !knownTag && (
          <Link
            href={href({ tag: "" })}
            scroll={false}
            className={[
              chipBase,
              chipActive,
              "inline-flex items-center gap-1",
            ].join(" ")}
          >
            {state.tag}
            <X size={12} />
          </Link>
        )}
      </div>
    </div>
  );
}
