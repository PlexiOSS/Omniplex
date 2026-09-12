"use client";

import { Pause, Play, Volume1, Volume2, VolumeX, X } from "lucide-react";
import Link from "next/link";
import { useSoundPlayer } from "@/hooks/useSoundPlayer";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function VolumeIcon({ volume, muted }: { volume: number; muted: boolean }) {
  if (muted || volume === 0) return <VolumeX size={16} />;
  if (volume < 0.5) return <Volume1 size={16} />;
  return <Volume2 size={16} />;
}

/** Fixed bottom bar, only rendered once a sound has been played somewhere on
 * the site -- see SoundPlayerProvider for the shared playback state every
 * sound tile (pack grids, /sounds, a sound's own detail page) reads from and
 * writes to instead of managing its own `Audio()` instance.
 *
 * Below `sm` the seek bar drops to its own second row and the volume slider
 * is hidden (just the mute toggle stays) -- letting everything wrap freely
 * used to make the bar as tall as three stacked rows on a narrow phone while
 * the reserved spacer below still only accounted for one, so the tail end of
 * the bar quietly overlapped the footer beneath it. Two explicit, bounded
 * layouts (one row at `sm+`, two rows below it) keep the bar's height
 * predictable so the spacer can actually match it. */
export function SoundPlayerBar() {
  const {
    track,
    isPlaying,
    currentTime,
    duration,
    volume,
    muted,
    togglePlayPause,
    stop,
    seek,
    setVolume,
    toggleMute,
  } = useSoundPlayer();

  if (!track) return null;

  const seekBar = (
    <div className="flex flex-1 items-center gap-2">
      <span className="w-9 shrink-0 text-right text-xs text-zinc-500 tabular-nums dark:text-zinc-400">
        {formatTime(currentTime)}
      </span>
      <input
        type="range"
        min={0}
        max={duration || 0}
        step={0.1}
        value={Math.min(currentTime, duration || 0)}
        onChange={(e) => seek(Number(e.target.value))}
        aria-label="Seek"
        className="h-1.5 w-full min-w-0 cursor-pointer appearance-none rounded-full bg-zinc-200 accent-accent dark:bg-zinc-800"
      />
      <span className="w-9 shrink-0 text-xs text-zinc-500 tabular-nums dark:text-zinc-400">
        {formatTime(duration)}
      </span>
    </div>
  );

  return (
    <>
      {/* Reserves scroll space so the fixed bar below never permanently
       * covers the last bit of the footer while a sound is loaded -- two
       * rows' worth below `sm`, one row's worth above it, matching the bar
       * itself exactly. */}
      <div aria-hidden className="h-24 sm:h-16" />
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 bg-white/95 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/95">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePlayPause}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-white transition-opacity hover:opacity-90"
            >
              {isPlaying ? (
                <Pause size={16} />
              ) : (
                <Play size={16} className="ml-0.5" />
              )}
            </button>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                {track.name}
              </p>
              {track.packUrl && track.packName ? (
                <Link
                  href={`/packs/${track.packUrl}`}
                  className="truncate text-xs text-zinc-500 transition-colors hover:text-accent dark:text-zinc-400"
                >
                  {track.packName}
                </Link>
              ) : null}
            </div>

            <div className="hidden flex-1 sm:flex">{seekBar}</div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={toggleMute}
                aria-label={muted ? "Unmute" : "Mute"}
                className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
              >
                <VolumeIcon volume={volume} muted={muted} />
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={muted ? 0 : volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                aria-label="Volume"
                className="hidden h-1.5 w-20 cursor-pointer appearance-none rounded-full bg-zinc-200 accent-accent sm:block dark:bg-zinc-800"
              />
              <button
                type="button"
                onClick={stop}
                aria-label="Stop"
                className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="mt-2 flex sm:hidden">{seekBar}</div>
        </div>
      </div>
    </>
  );
}
