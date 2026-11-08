"use client";

import { pageStyles } from "@omniplex/core/api";
import { ApiError } from "@omniplex/core/api/client";
import type {
  ManagedPageStyle,
  PageGradient,
  PageStyle,
} from "@omniplex/core/api/types";
import {
  PAGE_GRADIENTS,
  pageImageUrl,
  readableAccent,
} from "@omniplex/core/utils/pageStyle";
import { UploadError, uploadAsset } from "@omniplex/core/utils/upload";
import { Button } from "@omniplex/ui/Button";
import {
  Ban,
  Check,
  Clock,
  ImagePlus,
  Sparkles,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { FormMessage, SettingsCard } from "@/app/dashboard/manage/ManageShell";
import { PageBackground } from "./PageBackground";

const ACCENTS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#10b981",
  "#06b6d4",
  "#3b82f6",
];

type Draft = Pick<
  PageStyle,
  "gradient" | "accent" | "dim" | "blur" | "image_position" | "fixed"
>;

function draftFrom(style: ManagedPageStyle): Draft {
  return {
    gradient: style.gradient,
    accent: style.accent,
    dim: style.dim,
    blur: style.blur,
    image_position: style.image_position,
    fixed: style.fixed,
  };
}

function Slider({
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="flex items-center justify-between text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
        <span className="tabular-nums text-zinc-500 dark:text-zinc-400">
          {value}
          {unit}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-[var(--accent)]"
      />
    </label>
  );
}

export function PageStyleSection({
  target,
  id,
  userId,
  token,
}: {
  target: "bot" | "server";
  id: string;
  userId: string;
  token: string;
}) {
  const { data, error, mutate } = useSWR(
    ["manage/page-style", target, id],
    () => pageStyles.getManaged(target, id, token),
  );
  const [draft, setDraft] = useState<Draft | null>(null);
  const [customAccent, setCustomAccent] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (data) {
      setDraft(draftFrom(data));
      setCustomAccent(data.accent ?? "");
    }
  }, [data]);

  useEffect(
    () => () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    },
    [localPreview],
  );

  if (error) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Couldn&apos;t load the page style.
      </p>
    );
  }
  if (!data || !draft) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>;
  }

  if (!data.premium) {
    return (
      <SettingsCard
        title="Page style"
        description="Give your page its own background and accent colour."
      >
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-accent/20 bg-accent/5 p-5">
          <div className="flex items-start gap-3">
            <Sparkles size={18} className="mt-0.5 shrink-0 text-accent" />
            <div>
              <p className="font-medium text-zinc-950 dark:text-zinc-50">
                Unlock page styles
              </p>
              <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-300">
                Upload a background, pick a gradient and set your own accent
                colour. Comes with premium, or get 30 days with vote credits.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/shop/items?${target}=${id}`}
              className="inline-flex h-9 items-center rounded-lg border border-zinc-200 px-4 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Use credits
            </Link>
            <Link
              href={`/shop/premium?${target}=${id}`}
              className="inline-flex h-9 items-center rounded-lg bg-accent px-4 text-sm font-medium text-accent-fg hover:opacity-90"
            >
              Get premium
            </Link>
          </div>
        </div>
      </SettingsCard>
    );
  }

  const set = (patch: Partial<Draft>) =>
    setDraft((d) => (d ? { ...d, ...patch } : d));
  const accentOk = !draft.accent || readableAccent(draft.accent);
  const pendingUrl = data.pending_version
    ? pageImageUrl(target, id, data.pending_version)
    : null;
  const liveUrl = data.image_version
    ? pageImageUrl(target, id, data.image_version)
    : null;
  const previewImage = localPreview ?? pendingUrl ?? liveUrl;
  const previewStyle: PageStyle = {
    ...draft,
    image_version: null,
  };
  const dirty = JSON.stringify(draft) !== JSON.stringify(draftFrom(data));

  async function save(removeImage = false) {
    if (!draft) return;
    setSaving(true);
    setSaveError(null);
    setMessage(null);
    try {
      await pageStyles.update(
        target,
        id,
        { ...draft, remove_image: removeImage },
        token,
      );
      if (removeImage) setLocalPreview(null);
      await mutate();
      setMessage(removeImage ? "Background removed." : "Saved.");
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Couldn't save.");
    } finally {
      setSaving(false);
    }
  }

  async function upload(file: File) {
    setUploading(true);
    setSaveError(null);
    setMessage(null);
    setLocalPreview(URL.createObjectURL(file));
    try {
      await uploadAsset(`${target}-background`, id, file, { userId, token });
      await mutate();
      setMessage(
        "Uploaded. Your background shows once our team has approved it, usually within a day.",
      );
    } catch (err) {
      setLocalPreview(null);
      setSaveError(
        err instanceof UploadError ? err.message : "Couldn't upload that.",
      );
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <SettingsCard
      title="Page style"
      description={`Your ${target}'s page background and accent colour. Visitors see it on your page; everything else on Omniplex stays as it is.${data.unlocked_until ? ` Your Page Style pass runs until ${new Date(data.unlocked_until).toLocaleDateString(undefined, { day: "numeric", month: "long" })}; after that the style is kept but hidden until you renew or get premium.` : ""}`}
      footer={
        <>
          <FormMessage error={saveError} success={message} />
          <Button
            variant="primary"
            size="sm"
            loading={saving}
            disabled={!dirty || !accentOk}
            onClick={() => save()}
          >
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div
          className="relative isolate h-56 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
          style={
            draft.accent && accentOk
              ? ({ "--accent": draft.accent } as React.CSSProperties)
              : undefined
          }
        >
          <PageBackground
            target={target}
            id={id}
            style={{ ...previewStyle, fixed: false }}
            imageOverride={previewImage}
          />
          <div className="flex h-full flex-col justify-end p-5">
            <div className="flex items-center gap-3">
              <span className="size-12 rounded-2xl bg-zinc-200 ring-4 ring-white dark:bg-zinc-800 dark:ring-zinc-950" />
              <div>
                <span className="block h-3 w-32 rounded-full bg-zinc-900/80 dark:bg-zinc-100/80" />
                <span className="mt-2 block h-2 w-48 rounded-full bg-zinc-500/50" />
              </div>
              <span className="ml-auto rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-fg">
                Vote
              </span>
            </div>
          </div>
          <span className="absolute top-3 left-3 rounded-full bg-zinc-950/70 px-2 py-0.5 text-[11px] font-medium text-white">
            Preview
          </span>
        </div>

        <section>
          <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
            Background image
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) upload(file);
              }}
            />
            <Button
              variant="secondary"
              size="sm"
              loading={uploading}
              onClick={() => fileRef.current?.click()}
            >
              <ImagePlus size={14} />
              {liveUrl || pendingUrl ? "Replace image" : "Upload image"}
            </Button>
            {(liveUrl || pendingUrl) && (
              <Button
                variant="secondary"
                size="sm"
                disabled={saving}
                onClick={() => save(true)}
              >
                <Trash2 size={14} />
                Remove
              </Button>
            )}
          </div>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            PNG, JPEG or WebP up to 8 MB. Wide images work best (at least 1920
            pixels across). New images are checked by our team before they show.
          </p>
          {pendingUrl && (
            <p className="mt-3 flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
              <Clock size={13} />
              Waiting for review.{" "}
              {liveUrl
                ? "Your current background shows until then."
                : "Your gradient shows until then."}
            </p>
          )}
          {!pendingUrl && data.rejected_reason && (
            <p className="mt-3 flex items-start gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-300">
              <Ban size={13} className="mt-0.5 shrink-0" />
              Your last image wasn&apos;t approved: {data.rejected_reason}
            </p>
          )}
          {liveUrl && !pendingUrl && (
            <p className="mt-3 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400">
              <Check size={13} />
              Approved and live.
            </p>
          )}
        </section>

        <section>
          <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
            Gradient
          </p>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            Shows on its own, or behind your image while it loads.
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
            <button
              type="button"
              onClick={() => set({ gradient: null })}
              aria-pressed={!draft.gradient}
              className={[
                "flex h-14 items-center justify-center rounded-xl border text-xs font-medium",
                !draft.gradient
                  ? "border-accent ring-2 ring-accent/30"
                  : "border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400",
              ].join(" ")}
            >
              None
            </button>
            {PAGE_GRADIENTS.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => set({ gradient: g.id as PageGradient })}
                aria-pressed={draft.gradient === g.id}
                aria-label={g.label}
                className={[
                  "relative h-14 overflow-hidden rounded-xl border",
                  draft.gradient === g.id
                    ? "border-accent ring-2 ring-accent/30"
                    : "border-zinc-200 dark:border-zinc-800",
                ].join(" ")}
                style={{ backgroundImage: g.css }}
              >
                <span className="absolute bottom-1 left-2 text-[11px] font-medium text-white/90">
                  {g.label}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
            Accent colour
          </p>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            Used for buttons and links on your page. Leave it off to use each
            visitor&apos;s own accent.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                set({ accent: null });
                setCustomAccent("");
              }}
              aria-pressed={!draft.accent}
              className={[
                "h-8 rounded-full border px-3 text-xs font-medium",
                !draft.accent
                  ? "border-accent text-accent"
                  : "border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400",
              ].join(" ")}
            >
              Off
            </button>
            {ACCENTS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={c}
                aria-pressed={draft.accent === c}
                onClick={() => {
                  set({ accent: c });
                  setCustomAccent(c);
                }}
                className={[
                  "size-8 rounded-full ring-offset-2 ring-offset-white dark:ring-offset-zinc-900",
                  draft.accent === c
                    ? "ring-2 ring-zinc-950 dark:ring-white"
                    : "",
                ].join(" ")}
                style={{ backgroundColor: c }}
              />
            ))}
            <input
              value={customAccent}
              onChange={(e) => {
                const v = e.target.value.trim().toLowerCase();
                setCustomAccent(v);
                if (/^#[0-9a-f]{6}$/.test(v)) set({ accent: v });
              }}
              placeholder="#6366f1"
              aria-label="Custom accent colour"
              className="h-8 w-28 rounded-lg border border-zinc-200 bg-white px-2 font-mono text-xs text-zinc-950 outline-none focus:border-accent/50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </div>
          {!accentOk && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
              <TriangleAlert size={13} />
              That colour is too dark or too light to read on both light and
              dark mode.
            </p>
          )}
        </section>

        <section className="grid gap-5 sm:grid-cols-2">
          <Slider
            label="Fade into the page"
            value={draft.dim}
            min={30}
            max={90}
            unit="%"
            onChange={(dim) => set({ dim })}
          />
          <Slider
            label="Blur"
            value={draft.blur}
            min={0}
            max={24}
            unit="px"
            onChange={(blur) => set({ blur })}
          />
          <label className="block">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Image position
            </span>
            <select
              value={draft.image_position}
              onChange={(e) =>
                set({
                  image_position: e.target.value as Draft["image_position"],
                })
              }
              className="mt-2 h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-sm text-zinc-950 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
            >
              <option value="top">Top</option>
              <option value="center">Centre</option>
              <option value="bottom">Bottom</option>
            </select>
          </label>
          <label className="flex items-center gap-2 self-end pb-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={draft.fixed}
              onChange={(e) => set({ fixed: e.target.checked })}
              className="size-4 accent-[var(--accent)]"
            />
            Keep the background still while scrolling
          </label>
        </section>
      </div>
    </SettingsCard>
  );
}
