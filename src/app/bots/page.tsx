"use client";

import { useState } from "react";
import { BotCard } from "@/components/cards/BotCard";
import { Container } from "@/components/layout/Container";
import { Pagination } from "@/components/search/Pagination";
import { BotCardSkeleton } from "@/components/ui/Skeleton";
import { useBotList } from "@/hooks/useBots";

export default function BotsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useBotList(page);

  return (
    <Container className="py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          All Bots
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Browse every approved bot on the list.
        </p>
      </div>

      {error ? (
        <ErrorState message="Failed to load bots." />
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
            {data?.results.map((bot) => (
              <BotCard key={bot.bot_id} bot={bot} />
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

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-zinc-500 dark:text-zinc-400">
      <p className="text-sm">{message}</p>
    </div>
  );
}
