"use client";

import { Play, Plus, Square, X } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { PackSoundInput } from "@/lib/api/types";
import { packSoundUrl } from "@/lib/utils/assets";

const MAX_SOUNDS = 50;
const MAX_BYTES = 2 * 1024 * 1024;
const MAX_DURATION_MS = 10_000;
const ALLOWED_TYPE = "audio/mpeg";

/** Reads a file's playback duration client-side -- the server has no cheap
 * way to decode audio, so the length cap is enforced here at select time. */
function readDurationMs(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const objectUrl = URL.createObjectURL(file);
    audio.addEventListener("loadedmetadata", () => {
      URL.revokeObjectURL(objectUrl);
      resolve(Math.round(audio.duration * 1000));
    });
    audio.addEventListener("error", () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read audio metadata"));
    });
    audio.src = objectUrl;
  });
}

interface SoundPackBuilderProps {
  packUrl: string;
  userId: string;
  token: string;
  sounds: PackSoundInput[];
  onChange: (sounds: PackSoundInput[]) => void;
}

export function SoundPackBuilder({
  packUrl,
  userId,
  token,
  sounds,
  onChange,
}: SoundPackBuilderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);

    const remaining = MAX_SOUNDS - sounds.length;
    const toUpload = Array.from(files).slice(0, remaining);

    if (files.length > remaining) {
      setError(`Only ${remaining} more sound(s) can be added (50 max).`);
    }

    setUploading(true);

    // See StickerPackBuilder's identical comment: accumulated locally so a
    // multi-file batch doesn't clobber itself down to just the last file.
    const uploaded: PackSoundInput[] = [];

    for (const file of toUpload) {
      if (file.type !== ALLOWED_TYPE) {
        setError(`${file.name}: unsupported audio type — MP3 only.`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        setError(`${file.name}: too large — 2MB max per sound.`);
        continue;
      }

      let durationMs: number;
      try {
        durationMs = await readDurationMs(file);
      } catch {
        setError(`${file.name}: couldn't read audio metadata.`);
        continue;
      }

      if (durationMs > MAX_DURATION_MS) {
        setError(`${file.name}: too long — 10 seconds max per sound.`);
        continue;
      }

      const id = crypto.randomUUID();
      const name = file.name.replace(/\.[^.]+$/, "").slice(0, 32) || "sound";

      const form = new FormData();
      form.set("kind", "pack-sound");
      form.set("targetId", packUrl);
      form.set("assetId", id);
      form.set("userId", userId);
      form.set("token", token);
      form.set("file", file);

      try {
        const res = await fetch("/api/uploads", { method: "POST", body: form });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(`${file.name}: ${body.error ?? "upload failed"}`);
          continue;
        }
        uploaded.push({ id, name, duration_ms: durationMs });
        onChange([...sounds, ...uploaded]);
      } catch {
        setError(`${file.name}: upload failed.`);
      }
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeSound(id: string) {
    onChange(sounds.filter((s) => s.id !== id));
  }

  function renameSound(id: string, name: string) {
    onChange(sounds.map((s) => (s.id === id ? { ...s, name } : s)));
  }

  function togglePlay(sound: PackSoundInput) {
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
    <div>
      <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Sounds <span className="text-red-500">*</span>{" "}
        <span className="text-xs font-normal text-zinc-400">
          ({sounds.length}/{MAX_SOUNDS})
        </span>
      </p>

      {!packUrl.trim() ? (
        <p className="rounded-xl border border-dashed border-zinc-200 p-4 text-center text-sm text-zinc-400 dark:border-zinc-800 dark:text-zinc-600">
          Choose a pack URL above before adding sounds.
        </p>
      ) : (
        <>
          {sounds.length > 0 && (
            <div className="mb-3 space-y-1.5">
              {sounds.map((sound) => (
                <div
                  key={sound.id}
                  className="group flex items-center gap-2 rounded-xl border border-zinc-200 p-2 dark:border-zinc-800"
                >
                  <button
                    type="button"
                    onClick={() => togglePlay(sound)}
                    aria-label={playingId === sound.id ? "Stop" : "Play"}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 transition-colors hover:bg-accent/10 hover:text-accent dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    {playingId === sound.id ? (
                      <Square size={11} />
                    ) : (
                      <Play size={11} />
                    )}
                  </button>
                  <input
                    value={sound.name}
                    onChange={(e) => renameSound(sound.id, e.target.value)}
                    maxLength={32}
                    className="min-w-0 flex-1 rounded border-0 bg-transparent text-sm text-zinc-700 outline-none focus:bg-zinc-100 dark:text-zinc-300 dark:focus:bg-zinc-800"
                  />
                  <span className="shrink-0 text-xs text-zinc-400 dark:text-zinc-600">
                    {(sound.duration_ms / 1000).toFixed(1)}s
                  </span>
                  <button
                    type="button"
                    onClick={() => removeSound(sound.id)}
                    aria-label={`Remove ${sound.name}`}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-zinc-400 opacity-0 transition-opacity hover:bg-zinc-100 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-zinc-800 dark:hover:text-red-400"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {sounds.length < MAX_SOUNDS && (
            <Button
              type="button"
              variant="secondary"
              loading={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <Plus size={14} />
              Add Sound
            </Button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/mpeg"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </>
      )}

      {error && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
