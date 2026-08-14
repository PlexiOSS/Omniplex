"use client";

import { useState } from "react";
import { BotCard } from "@/components/cards/BotCard";
import { Container } from "@/components/layout/Container";
import { Pagination } from "@/components/search/Pagination";
import { BotCardSkeleton } from "@/components/ui/Skeleton";
import { useBotList } from "@/hooks/useBots";

export default function BotsPage() {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<"trending" | undefined>(undefined);
  const { data, isLoading, error } = useBotList(page, sort);

  return (
    <Container className="py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
            All Bots
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Browse every approved bot on the list.
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
