"use client";

import { Pause, Play } from "lucide-react";
import Link from "next/link";
import { useSoundPlayer } from "@/hooks/useSoundPlayer";
import type { PackSound } from "@/lib/api/types";
import { packSoundUrl } from "@/lib/utils/assets";

interface PackSoundGridProps {
  packUrl: string;
  packName?: string;
  sounds: PackSound[];
}

/** "Sounds in this pack" -- Emojis/Stickers get an image grid; sounds get
 * the same grid shape with an inline play/pause button instead of a static
 * thumbnail, since there's nothing to show a sound clip as a picture of.
 * Playback itself goes through the shared SoundPlayerProvider (the fixed
 * bottom bar), not a per-tile `Audio()` instance, so play/pause/stop/volume
 * all stay consistent with every other sound tile on the site. */
export function PackSoundGrid({
  packUrl,
  packName,
  sounds,
}: PackSoundGridProps) {
  const { track, isPlaying, play, togglePlayPause } = useSoundPlayer();

  function handleClick(sound: PackSound) {
    if (track?.id === sound.id) {
      togglePlayPause();
      return;
    }
    play({
      id: sound.id,
      name: sound.name,
      url: packSoundUrl(packUrl, sound.id),
      packUrl,
      packName,
    });
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-3">
      {sounds.map((sound) => {
        const active = track?.id === sound.id && isPlaying;
        return (
          <div
            key={sound.id}
            className="group flex flex-col items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <button
              type="button"
              onClick={() => handleClick(sound)}
              aria-label={active ? "Pause" : "Play"}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 transition-colors hover:bg-accent/10 hover:text-accent dark:bg-zinc-800 dark:text-zinc-300"
            >
              {active ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <Link
              href={`/sounds/${sound.id}`}
              title={sound.name}
              className="w-full truncate text-center text-[11px] text-zinc-500 transition-colors hover:text-accent dark:text-zinc-400"
            >
              {sound.name}
            </Link>
          </div>
        );
      })}
    </div>
  );
}
