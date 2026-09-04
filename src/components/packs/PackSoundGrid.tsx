"use client";

import { Play, Square } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import type { PackSound } from "@/lib/api/types";
import { packSoundUrl } from "@/lib/utils/assets";

interface PackSoundGridProps {
  packUrl: string;
  sounds: PackSound[];
}

/** "Sounds in this pack" -- Emojis/Stickers get an image grid; sounds get
 * the same grid shape with an inline play/stop button instead of a static
 * thumbnail, since there's nothing to show a sound clip as a picture of. */
export function PackSoundGrid({ packUrl, sounds }: PackSoundGridProps) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function togglePlay(sound: PackSound) {
    if (playingId === sound.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    audioRef.current?.pause();
    const audio = new Audio(packSoundUrl(packUrl, sound.id));
    audio.addEventListener("ended", () => setPlayingId(null));
    audioRef.current = audio;
    audio.play().catch(() => setPlayingId(null));
    setPlayingId(sound.id);
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-3">
      {sounds.map((sound) => (
        <div
          key={sound.id}
          className="group flex flex-col items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <button
            type="button"
            onClick={() => togglePlay(sound)}
            aria-label={playingId === sound.id ? "Stop" : "Play"}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 transition-colors hover:bg-accent/10 hover:text-accent dark:bg-zinc-800 dark:text-zinc-300"
          >
            {playingId === sound.id ? <Square size={14} /> : <Play size={14} />}
          </button>
          <Link
            href={`/sounds/${sound.id}`}
            title={sound.name}
            className="w-full truncate text-center text-[11px] text-zinc-500 transition-colors hover:text-accent dark:text-zinc-400"
          >
            {sound.name}
          </Link>
        </div>
      ))}
    </div>
  );
}
