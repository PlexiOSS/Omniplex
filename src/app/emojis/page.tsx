"use client";

import { ArrowUpRight, Smile } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Container } from "@/components/layout/Container";
import { Pagination } from "@/components/search/Pagination";
import { EmojiStickerGallery } from "@/components/servers/EmojiStickerGallery";
import { Avatar } from "@/components/ui/Avatar";
import { useServerEmojis } from "@/hooks/useServers";

export default function EmojisPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useServerEmojis(page);

  return (
    <Container className="py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          Emojis &amp; Stickers
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Browse custom emojis and stickers from servers that have opted in
          to showing them.
        </p>
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-500 dark:text-zinc-400">
          <p className="text-sm">Failed to load emojis.</p>
        </div>
      ) : isLoading ? (
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-50" />
      ) : data && data.results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center text-zinc-500 dark:text-zinc-400">
          <Smile size={24} className="mb-2 text-zinc-300 dark:text-zinc-700" />
          <p className="text-sm">
            No servers have opted in to showing their emojis yet.
          </p>
        </div>
      ) : (
        <>
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {data?.results.map((server) => (
              <div key={server.server_id} className="py-8 first:pt-0">
                <Link
                  href={`/servers/${server.server_id}`}
                  className="group flex items-center gap-2.5"
                >
                  <Avatar src={server.avatar} alt={server.name} size={28} />
                  <span className="font-semibold text-zinc-950 transition-colors group-hover:text-accent dark:text-zinc-50">
                    {server.name}
                  </span>
                  <ArrowUpRight
                    size={14}
                    className="text-zinc-300 transition-colors group-hover:text-accent dark:text-zinc-700"
                  />
                </Link>
                <EmojiStickerGallery
                  emojis={server.emojis}
                  stickers={server.stickers}
                />
              </div>
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
