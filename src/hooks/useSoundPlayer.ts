"use client";

// Copyright (C) 2026 NodeByte LTD

import { createContext, useContext } from "react";

export interface SoundTrack {
  id: string;
  name: string;
  url: string;
  packUrl?: string;
  packName?: string;
}

export const VOLUME_STORAGE_KEY = "omniplex-sound-volume";

export interface SoundPlayerContextValue {
  track: SoundTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  /** Loads and plays `track` from the start. Replaces whatever was playing. */
  play: (track: SoundTrack) => void;
  /** Pauses/resumes the current track in place; no-op with nothing loaded. */
  togglePlayPause: () => void;
  /** Pauses and unloads the current track entirely, hiding the player bar. */
  stop: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
}

export const SoundPlayerContext = createContext<SoundPlayerContextValue>({
  track: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  muted: false,
  play: () => {},
  togglePlayPause: () => {},
  stop: () => {},
  seek: () => {},
  setVolume: () => {},
  toggleMute: () => {},
});

export function useSoundPlayer() {
  return useContext(SoundPlayerContext);
}
