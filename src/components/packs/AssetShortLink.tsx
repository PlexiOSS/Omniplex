import { Link2 } from "lucide-react";

interface AssetShortLinkProps {
  vanity: string;
  basePath: string;
}

/** Read-only display of an emoji/sticker's vanity short link. Editing lives
 * in the dashboard's pack edit flow now, not here -- every other entity on
 * the site (bots, servers, packs) keeps editing off its public page, and
 * this used to be the one exception. Renders nothing when no vanity is
 * set, for owner and non-owner alike. */
export function AssetShortLink({ vanity, basePath }: AssetShortLinkProps) {
  if (!vanity) return null;

  return (
    <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <h3 className="mb-2 flex items-center gap-1.5 text-sm font-medium text-zinc-950 dark:text-zinc-50">
        <Link2 size={14} />
        Short link
      </h3>
      <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
        {basePath}/{vanity}
      </p>
    </div>
  );
}
