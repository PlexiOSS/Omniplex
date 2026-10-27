import { ArrowLeft, Layers } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { ENTITY_ACTION_CLASS } from "@/components/ui/entityAction";
import { ShortLinkButton } from "@/components/ui/ShortLinkButton";
import { BASE_URL } from "@/lib/api/config";
import type { PlatformUser } from "@/lib/api/types";

interface AssetHeroProps {
  backHref: string;
  backLabel: string;
  preview: ReactNode;
  title: string;
  badges?: ReactNode;
  packUrl: string;
  packName: string;
  owner: PlatformUser;
  stats: { label: string; value: string }[];
  download: ReactNode;
  vanity?: string;
  basePath: string;
}

export function AssetHero({
  backHref,
  backLabel,
  preview,
  title,
  badges,
  packUrl,
  packName,
  owner,
  stats,
  download,
  vanity,
  basePath,
}: AssetHeroProps) {
  return (
    <>
      <Link
        href={backHref}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        <ArrowLeft size={14} />
        {backLabel}
      </Link>

      <section className="grid overflow-hidden rounded-2xl border border-zinc-200 bg-white md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex min-h-64 items-center justify-center border-b border-zinc-200 bg-zinc-50 bg-[radial-gradient(#e4e4e7_1px,transparent_1px)] [background-size:16px_16px] p-8 md:border-r md:border-b-0 dark:border-zinc-800 dark:bg-zinc-950 dark:bg-[radial-gradient(#27272a_1px,transparent_1px)]">
          {preview}
        </div>

        <div className="flex min-w-0 flex-col p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="min-w-0 text-2xl font-semibold tracking-tight text-zinc-950 wrap-anywhere sm:text-3xl dark:text-zinc-50">
              {title}
            </h1>
            {badges}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-500 dark:text-zinc-400">
            <Link
              href={`/packs/${packUrl}`}
              className="inline-flex items-center gap-1.5 font-medium text-accent hover:underline"
            >
              <Layers size={14} />
              {packName}
            </Link>
            <Link
              href={`/user/${owner.id}`}
              className="inline-flex min-w-0 items-center gap-1.5 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              <Avatar src={owner.avatar} alt={owner.username} size={20} />
              <span className="truncate">
                by {owner.display_name || owner.username}
              </span>
            </Link>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-zinc-200 px-3 py-2.5 dark:border-zinc-800"
              >
                <dt className="text-xs text-zinc-500 dark:text-zinc-400">
                  {s.label}
                </dt>
                <dd className="mt-0.5 text-sm font-semibold tabular-nums text-zinc-950 dark:text-zinc-50">
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 flex flex-wrap items-center gap-2 md:mt-auto md:pt-6">
            {download}
            {vanity && (
              <ShortLinkButton url={`${BASE_URL}${basePath}/${vanity}`} />
            )}
            <Link href={`/packs/${packUrl}`} className={ENTITY_ACTION_CLASS}>
              <Layers size={13} />
              View pack
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
