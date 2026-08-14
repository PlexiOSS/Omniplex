"use client";

import { useState } from "react";
import { ServerCard } from "@/components/cards/ServerCard";
import { Container } from "@/components/layout/Container";
import { Pagination } from "@/components/search/Pagination";
import { BotCardSkeleton } from "@/components/ui/Skeleton";
import { useServerList } from "@/hooks/useServers";

export default function ServersPage() {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<"trending" | undefined>(undefined);
  const { data, isLoading, error } = useServerList(page, sort);

  return (
    <Container className="py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
            All Servers
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Browse Discord servers listed on Omniplex.
          </p>
        </div>
        <div className="flex overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
          {(
            [
              { value: undefined, label: "Newest" },
              { value: "trending", label: "Trending" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => {
                setSort(opt.value);
                setPage(1);
              }}
              className={[
                "px-3 py-1.5 text-sm font-medium transition-colors",
                sort === opt.value
                  ? "bg-accent/10 text-accent"
                  : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800",
              ].join(" ")}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <EmptyState message="Failed to load servers." />
      ) : isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
            <BotCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data?.results.map((server) => (
              <ServerCard key={server.server_id} server={server} />
            ))}
          </div>
          {data && (
            <div className="mt-10">
              <Pagination
                page={page}
                total={data.count}
                perPage={data.per_page}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}
    </Container>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-zinc-500 dark:text-zinc-400">
      <p className="text-sm">{message}</p>
    </div>
  );
}
