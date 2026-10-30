"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  SoundPlayerContext,
  type SoundTrack,
  VOLUME_STORAGE_KEY,
} from "@/hooks/useSoundPlayer";

function readStoredVolume(): number {
  try {
    const raw = localStorage.getItem(VOLUME_STORAGE_KEY);
    if (raw === null) return 1;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? Math.min(1, Math.max(0, parsed)) : 1;
  } catch {
    return 1;
  }
}

/** One shared `<audio>` element for every sound clip on the site -- pack
 * grids, the flat /sounds browse page, and the sound detail page all play
 * through this single context instead of each spinning up its own `Audio()`
 * instance, so starting one sound correctly stops any other that was
 * playing, and volume/mute preference is shared and persisted everywhere. */
export function SoundPlayerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [track, setTrack] = useState<SoundTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audioRef.current = audio;
    const storedVolume = readStoredVolume();
    audio.volume = storedVolume;
    setVolumeState(storedVolume);

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.pause();
    };
  }, []);

  const play = useCallback((next: SoundTrack) => {
    const audio = audioRef.current;
    if (!audio) return;
    setTrack(next);
    setCurrentTime(0);
    setDuration(0);
    audio.src = next.url;
    audio.currentTime = 0;
    audio.play().catch(() => setIsPlaying(false));
  }, []);

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !track) return;
    if (audio.paused) {
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, [track]);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    setTrack(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
  }, []);

  const setVolume = useCallback((next: number) => {
    const audio = audioRef.current;
    const clamped = Math.min(1, Math.max(0, next));
    if (audio) {
      audio.volume = clamped;
      audio.muted = false;
    }
    setVolumeState(clamped);
    setMuted(false);
    try {
      localStorage.setItem(VOLUME_STORAGE_KEY, String(clamped));
    } catch {}
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const next = !audio.muted;
    audio.muted = next;
    setMuted(next);
  }, []);

  return (
    <SoundPlayerContext.Provider
      value={{
        track,
        isPlaying,
        currentTime,
        duration,
        volume,
        muted,
        play,
        togglePlayPause,
        stop,
        seek,
        setVolume,
        toggleMute,
      }}
    >
      {children}
    </SoundPlayerContext.Provider>
  );
}
