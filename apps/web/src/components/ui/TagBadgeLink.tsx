import Link from "next/link";

interface TagBadgeLinkProps {
  tag: string;
  /** Marks the tag as shared with something else being compared against it
   * (see the compare pages) — same badge, just with an accent ring. */
  highlighted?: boolean;
}

/** A tag rendered as a clickable link to its dedicated browse page
 * (`/tags/[tag]`), styled like the plain `Badge` component but with a
 * hover affordance since it's actually interactive. Kept separate from
 * `Badge` itself rather than adding an optional `href` there -- `Badge` is
 * used for a lot of non-tag, non-clickable things (NSFW, Certified,
 * Premium, ...) and shouldn't grow link semantics globally. */
export function TagBadgeLink({ tag, highlighted }: TagBadgeLinkProps) {
  return (
    <Link
      href={`/tags/${encodeURIComponent(tag)}`}
      className={[
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors",
        highlighted
          ? "bg-accent/10 text-accent ring-1 ring-accent/30 hover:bg-accent/20"
          : "bg-zinc-100 text-zinc-700 hover:bg-accent/10 hover:text-accent dark:bg-zinc-800 dark:text-zinc-300",
      ].join(" ")}
    >
      {tag}
    </Link>
  );
}
