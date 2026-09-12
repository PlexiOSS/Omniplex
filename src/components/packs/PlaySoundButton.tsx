"use client";

import { Pause, Play } from "lucide-react";
import { useSoundPlayer } from "@/hooks/useSoundPlayer";

interface PlaySoundButtonProps {
  id: string;
  name: string;
  assetUrl: string;
  packUrl?: string;
  packName?: string;
}

/** Large centered play/pause control -- the sound detail page's counterpart
 * to a full-size image preview, since there's nothing to show a sound clip
 * as a picture of. Goes through the shared SoundPlayerProvider so playing
 * from here and playing from a pack grid or the /sounds browse page all
 * share one player (and one "what's currently loaded" state) instead of
 * fighting over separate `Audio()` instances. */
export function PlaySoundButton({
  id,
  name,
  assetUrl,
  packUrl,
  packName,
}: PlaySoundButtonProps) {
  const { track, isPlaying, play, togglePlayPause } = useSoundPlayer();
  const active = track?.id === id && isPlaying;

  function handleClick() {
    if (track?.id === id) {
      togglePlayPause();
      return;
    }
    play({ id, name, url: assetUrl, packUrl, packName });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={active ? "Pause" : "Play"}
      className="flex h-24 w-24 items-center justify-center rounded-full bg-accent/10 text-accent transition-colors hover:bg-accent/20"
    >
      {active ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
    </button>
  );
}
