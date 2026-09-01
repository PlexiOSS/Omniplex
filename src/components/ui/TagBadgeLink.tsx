import Link from "next/link";

interface TagBadgeLinkProps {
  tag: string;
}

/** A tag rendered as a clickable link to its dedicated browse page
 * (`/tags/[tag]`), styled like the plain `Badge` component but with a
 * hover affordance since it's actually interactive. Kept separate from
 * `Badge` itself rather than adding an optional `href` there -- `Badge` is
 * used for a lot of non-tag, non-clickable things (NSFW, Certified,
 * Premium, ...) and shouldn't grow link semantics globally. */
export function TagBadgeLink({ tag }: TagBadgeLinkProps) {
  return (
    <Link
      href={`/tags/${encodeURIComponent(tag)}`}
      className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-accent/10 hover:text-accent dark:bg-zinc-800 dark:text-zinc-300"
    >
      {tag}
    </Link>
  );
}
