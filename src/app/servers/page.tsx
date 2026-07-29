"use client";

import { useState } from "react";
import { ServerCard } from "@/components/cards/ServerCard";
import { Container } from "@/components/layout/Container";
import { Pagination } from "@/components/search/Pagination";
import { BotCardSkeleton } from "@/components/ui/Skeleton";
import { useServerList } from "@/hooks/useServers";

export default function ServersPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useServerList(page);

  return (
    <Container className="py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          All Servers
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Browse Discord servers listed on Omniplex.
        </p>
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
