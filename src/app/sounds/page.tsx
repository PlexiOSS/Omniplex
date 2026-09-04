"use client";

import { Layers, Music, Play, Square } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import useSWR from "swr";
import { Container } from "@/components/layout/Container";
import { Pagination } from "@/components/search/Pagination";
import { sounds } from "@/lib/api";
import type { FlatPackSound } from "@/lib/api/types";
import { packSoundUrl } from "@/lib/utils/assets";

export default function SoundsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useSWR(`sounds/all/${page}`, () =>
    sounds.getAll(page),
  );
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const results = data?.results ?? [];

  function togglePlay(sound: FlatPackSound) {
    if (playingId === sound.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    audioRef.current?.pause();
    const audio = new Audio(packSoundUrl(sound.pack_url, sound.id));
    audio.addEventListener("ended", () => setPlayingId(null));
    audioRef.current = audio;
    audio.play().catch(() => setPlayingId(null));
    setPlayingId(sound.id);
  }

  return (
    <Container className="py-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
            Sounds
          </h1>
          <p className="mt-1 max-w-lg text-sm text-zinc-500 dark:text-zinc-400">
            Every sound from every Sound Pack, browsable on its own. Click one
            to see who made it, which pack it's from, and download it
            individually.
          </p>
        </div>
        <Link
          href="/packs?pack_type=sound"
          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:border-accent/40 hover:bg-accent/5 hover:text-accent dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-accent/40 dark:hover:bg-accent/10"
        >
          <Layers size={14} />
          Browse Sound Packs
        </Link>
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-500 dark:text-zinc-400">
          <p className="text-sm">Failed to load sounds.</p>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-50" />
        </div>
      ) : results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center text-zinc-500 dark:text-zinc-400">
          <Music size={24} className="mb-2 text-zinc-300 dark:text-zinc-700" />
          <p className="text-sm">No sounds have been uploaded yet.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-3">
            {results.map((sound) => (
              <div
                key={sound.id}
                title={`${sound.name} from ${sound.pack_name}`}
                className="group flex flex-col items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-center transition-colors hover:border-accent/40 hover:bg-accent/5 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-accent/40 dark:hover:bg-accent/10"
              >
                <button
                  type="button"
                  onClick={() => togglePlay(sound)}
                  aria-label={playingId === sound.id ? "Stop" : "Play"}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 transition-colors hover:bg-accent/10 hover:text-accent dark:bg-zinc-800 dark:text-zinc-300"
                >
                  {playingId === sound.id ? (
                    <Square size={14} />
                  ) : (
                    <Play size={14} />
                  )}
                </button>
                <Link
                  href={`/sounds/${sound.id}`}
                  className="w-full truncate text-[11px] text-zinc-500 transition-colors hover:text-accent dark:text-zinc-400"
                >
                  {sound.name}
                </Link>
              </div>
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
