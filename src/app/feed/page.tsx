"use client";

import { Megaphone } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Container } from "@/components/layout/Container";
import { Pagination } from "@/components/search/Pagination";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { useBotChangelogFeed } from "@/hooks/useBots";
import { mirroredAvatarUrl } from "@/lib/utils/assets";
import { formatRelativeTime } from "@/lib/utils/format";

export default function FeedPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useBotChangelogFeed(page);

  return (
    <Container className="py-10" narrow>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          Feed
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Updates bot owners have posted, newest first.
        </p>
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-500 dark:text-zinc-400">
          <p className="text-sm">Failed to load the feed.</p>
        </div>
      ) : isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
            <div
              key={i}
              className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <div className="flex items-center gap-2.5">
                <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="mt-3 h-4 w-2/3" />
              <Skeleton className="mt-2 h-3 w-full" />
            </div>
          ))}
        </div>
      ) : !data || data.results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center text-zinc-500 dark:text-zinc-400">
          <Megaphone
            size={28}
            className="mb-3 text-zinc-300 dark:text-zinc-700"
          />
          <p className="text-sm">No updates posted yet.</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {data.results.map((entry) => (
              <div
                key={entry.id}
                className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <Link
                  href={`/bots/${entry.bot_id}`}
                  className="flex items-center gap-2.5"
                >
                  <Avatar
                    src={mirroredAvatarUrl(
                      "bots",
                      entry.bot_id,
                      entry.user.avatar,
                    )}
                    alt={entry.user.username}
                    size={28}
                  />
                  <span className="text-sm font-medium text-zinc-950 transition-colors hover:text-accent dark:text-zinc-50">
                    {entry.user.username}
                  </span>
                </Link>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Link
                    href={`/bots/${entry.bot_id}?changelog=${entry.id}`}
                    className="font-medium text-zinc-950 transition-colors hover:text-accent dark:text-zinc-50"
                  >
                    {entry.title}
                  </Link>
                  {entry.version && (
                    <Badge variant="info">{entry.version}</Badge>
                  )}
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-300">
                  {entry.content}
                </p>
                <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-600">
                  {formatRelativeTime(entry.created_at)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <Pagination
              page={page}
              total={data.count}
              perPage={data.per_page}
              onPageChange={setPage}
            />
          </div>
        </>
      )}
    </Container>
  );
}
