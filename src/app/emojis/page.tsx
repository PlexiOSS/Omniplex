"use client";

import { Layers, Smile } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Pagination } from "@/components/search/Pagination";
import { EmojiImage } from "@/components/servers/EmojiStickerMedia";
import { ErrorState, LoadingState } from "@/components/ui/PageStates";
import { emojis } from "@/lib/api";
import { packEmojiUrl } from "@/lib/utils/assets";

export default function EmojisPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error, mutate } = useSWR(`emojis/all/${page}`, () =>
    emojis.getAll(page),
  );

  const results = data?.results ?? [];

  return (
    <Container className="py-10">
      <PageHeader
        icon={Smile}
        title="Emojis"
        description="Every emoji from every Emoji Pack, browsable on its own. Click one to see who made it, which pack it's from, and download it individually."
        actions={
          <>
            <Link
              href="/packs?pack_type=emoji"
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:border-accent/40 hover:bg-accent/5 hover:text-accent dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-accent/40 dark:hover:bg-accent/10"
            >
              <Layers size={14} />
              Browse Emoji Packs
            </Link>
          </>
        }
      />

      {error ? (
        <ErrorState
          message="We couldn't load emojis right now."
          onRetry={() => mutate()}
        />
      ) : isLoading ? (
        <LoadingState />
      ) : results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center text-zinc-500 dark:text-zinc-400">
          <Smile size={24} className="mb-2 text-zinc-300 dark:text-zinc-700" />
          <p className="text-sm">No emojis have been uploaded yet.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-3">
            {results.map((emoji) => (
              <Link
                key={emoji.id}
                href={`/emojis/${emoji.id}`}
                title={`:${emoji.name}: from ${emoji.pack_name}`}
                className="group flex flex-col items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-center transition-colors hover:border-accent/40 hover:bg-accent/5 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-accent/40 dark:hover:bg-accent/10"
              >
                <EmojiImage
                  url={packEmojiUrl(emoji.pack_url, emoji.id, emoji.animated)}
                  name={emoji.name}
                  animated={emoji.animated}
                  size={40}
                />
                <span className="w-full truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                  {emoji.name}
                </span>
              </Link>
            ))}
          </div>

          {data && data.count > data.per_page && (
            <div className="mt-8">
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
