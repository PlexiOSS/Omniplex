"use client";

import { Play, Square } from "lucide-react";
import { useRef, useState } from "react";

interface PlaySoundButtonProps {
  assetUrl: string;
}

/** Large centered play/stop control -- StickerPage's counterpart to a
 * full-size image preview, since there's nothing to show a sound clip as a
 * picture of. */
export function PlaySoundButton({ assetUrl }: PlaySoundButtonProps) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function toggle() {
    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
      return;
    }
    const audio = new Audio(assetUrl);
    audio.addEventListener("ended", () => setPlaying(false));
    audioRef.current = audio;
    audio.play().catch(() => setPlaying(false));
    setPlaying(true);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={playing ? "Stop" : "Play"}
      className="flex h-24 w-24 items-center justify-center rounded-full bg-accent/10 text-accent transition-colors hover:bg-accent/20"
    >
      {playing ? <Square size={32} /> : <Play size={32} className="ml-1" />}
    </button>
  );
}
