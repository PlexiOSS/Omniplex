"use client";

import { pageStyles } from "@omniplex/core/api";
import { ApiError } from "@omniplex/core/api/client";
import type {
  ManagedPageStyle,
  PageGradient,
  PageStyle,
} from "@omniplex/core/api/types";
import {
  customGradient,
  gradientCss,
  PAGE_GRADIENTS,
  pageImageUrl,
  parseCustomGradient,
  readableAccent,
} from "@omniplex/core/utils/pageStyle";
import { UploadError, uploadAsset } from "@omniplex/core/utils/upload";
import { Button } from "@omniplex/ui/Button";
import {
  Ban,
  Check,
  Clock,
  ImagePlus,
  Palette,
  RotateCcw,
  Sparkles,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { FormMessage, SettingsCard } from "@/app/dashboard/manage/ManageShell";
import { type PagePreviewListing, PageStylePreview } from "./PageStylePreview";

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

const IMAGE_POSITIONS = [
  { value: "top", label: "Top" },
  { value: "center", label: "Centre" },
  { value: "bottom", label: "Bottom" },
] as const;

function GroupTitle({
  children,
  hint,
}: {
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="mb-2">
      <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
        {children}
      </p>
      {hint && (
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          {hint}
        </p>
      )}
    </div>
  );
}

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
  listing,
}: {
  target: "bot" | "server";
  id: string;
  userId: string;
  token: string;
  listing: PagePreviewListing;
}) {
  const { data, error, mutate } = useSWR(
    ["manage/page-style", target, id],
    () => pageStyles.getManaged(target, id, token),
  );
  const [draft, setDraft] = useState<Draft | null>(null);
  const [customAccent, setCustomAccent] = useState("");
  const [customFrom, setCustomFrom] = useState("#4f46e5");
  const [customTo, setCustomTo] = useState("#0f172a");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (data) {
      setDraft(draftFrom(data));
      setCustomAccent(data.accent ?? "");
      const custom = parseCustomGradient(data.gradient);
      if (custom) {
        setCustomFrom(custom.from);
        setCustomTo(custom.to);
      }
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
  const customColours = parseCustomGradient(draft.gradient);
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

  const hasImage = !!(previewImage || liveUrl || pendingUrl);
  const status =
    localPreview && uploading
      ? null
      : pendingUrl
        ? "review"
        : liveUrl
          ? "live"
          : null;

  return (
    <SettingsCard
      title="Page style"
      description={`Give your ${target}'s page its own look. Only your page changes; the rest of Omniplex stays the same.`}
      footer={
        <>
          <FormMessage error={saveError} success={message} />
          {dirty && (
            <span className="mr-auto text-xs text-zinc-500 dark:text-zinc-400">
              Unsaved changes
            </span>
          )}
          {dirty && (
            <Button
              variant="secondary"
              size="sm"
              disabled={saving}
              onClick={() => {
                setDraft(draftFrom(data));
                setCustomAccent(data.accent ?? "");
              }}
            >
              <RotateCcw size={14} />
              Discard
            </Button>
          )}
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
      {data.unlocked_until && (
        <p className="flex items-start gap-2 rounded-lg bg-accent/10 px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300">
          <Sparkles size={13} className="mt-0.5 shrink-0 text-accent" />
          Your Page Style pass runs until{" "}
          {new Date(data.unlocked_until).toLocaleDateString(undefined, {
            day: "numeric",
            month: "long",
          })}
          . After that your style is kept but hidden until you renew or get
          premium.
        </p>
      )}

      <div className="space-y-6">
        <div className="min-w-0">
          <PageStylePreview
            target={target}
            id={id}
            style={previewStyle}
            image={previewImage}
            listing={listing}
            note={
              pendingUrl
                ? "Your new image is shown here. Visitors see it once it's approved."
                : undefined
            }
          />
        </div>

        <div className="grid gap-x-8 gap-y-6 border-t border-zinc-100 pt-6 md:grid-cols-2 dark:border-zinc-800">
          <section>
            <GroupTitle>Background image</GroupTitle>
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
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) upload(file);
              }}
              className={[
                "relative flex h-28 w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border bg-cover bg-center text-center transition-colors disabled:opacity-70",
                dragging
                  ? "border-accent bg-accent/10"
                  : previewImage
                    ? "border-zinc-200 dark:border-zinc-800"
                    : "border-dashed border-zinc-300 hover:border-accent/50 dark:border-zinc-700",
              ].join(" ")}
              style={
                previewImage
                  ? { backgroundImage: `url("${previewImage}")` }
                  : undefined
              }
            >
              {previewImage ? (
                <span className="absolute inset-x-0 bottom-0 bg-zinc-950/70 py-1 text-xs font-medium text-white">
                  {uploading ? "Uploading…" : "Replace image"}
                </span>
              ) : (
                <>
                  <ImagePlus size={18} className="text-zinc-400" />
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {uploading ? "Uploading…" : "Upload or drop an image"}
                  </span>
                </>
              )}
              {status && (
                <span
                  className={[
                    "absolute top-2 left-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-white",
                    status === "live" ? "bg-emerald-600" : "bg-amber-600",
                  ].join(" ")}
                >
                  {status === "live" ? (
                    <Check size={11} />
                  ) : (
                    <Clock size={11} />
                  )}
                  {status === "live" ? "Live" : "In review"}
                </span>
              )}
            </button>
            <div className="mt-2 flex items-start justify-between gap-3">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                PNG, JPEG or WebP, up to 8 MB and at least 1920 pixels wide. Our
                team checks new images, usually within a day.
              </p>
              {(liveUrl || pendingUrl) && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => save(true)}
                  aria-label="Remove image"
                  title="Remove image"
                  className="shrink-0 rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-red-500/10 hover:text-red-600"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            {!pendingUrl && data.rejected_reason && (
              <p className="mt-2 flex items-start gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-300">
                <Ban size={13} className="mt-0.5 shrink-0" />
                Your last image wasn&apos;t approved: {data.rejected_reason}
              </p>
            )}
          </section>

          <section>
            <GroupTitle
              hint={
                hasImage ? "Shows behind your image while it loads." : undefined
              }
            >
              Gradient
            </GroupTitle>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => set({ gradient: null })}
                aria-pressed={!draft.gradient}
                className={[
                  "flex h-12 items-center justify-center rounded-lg border text-[11px] font-medium",
                  !draft.gradient
                    ? "border-accent text-accent ring-1 ring-accent"
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
                  className={[
                    "relative flex h-12 items-end overflow-hidden rounded-lg border p-1.5 text-[11px] font-medium text-white",
                    draft.gradient === g.id
                      ? "border-accent ring-1 ring-accent"
                      : "border-transparent",
                  ].join(" ")}
                  style={{ backgroundImage: g.css }}
                >
                  {g.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() =>
                  set({ gradient: customGradient(customFrom, customTo) })
                }
                aria-pressed={!!customColours}
                className={[
                  "relative col-span-3 flex h-12 items-end overflow-hidden rounded-lg border p-1.5 text-[11px] font-medium text-white",
                  customColours
                    ? "border-accent ring-1 ring-accent"
                    : "border-dashed border-zinc-300 dark:border-zinc-700",
                ].join(" ")}
                style={{
                  backgroundImage:
                    gradientCss(customGradient(customFrom, customTo)) ??
                    undefined,
                }}
              >
                <span className="inline-flex items-center gap-1">
                  <Palette size={11} />
                  Custom
                </span>
              </button>
            </div>
            {customColours && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {(
                  [
                    ["From", customFrom, setCustomFrom, "to"],
                    ["To", customTo, setCustomTo, "from"],
                  ] as const
                ).map(([label, value, setValue, other]) => (
                  <label key={label} className="flex items-center gap-2">
                    <input
                      type="color"
                      value={value}
                      onChange={(e) => {
                        const v = e.target.value.toLowerCase();
                        setValue(v);
                        set({
                          gradient:
                            other === "to"
                              ? customGradient(v, customTo)
                              : customGradient(customFrom, v),
                        });
                      }}
                      aria-label={`Custom gradient ${label.toLowerCase()} colour`}
                      className="size-8 shrink-0 cursor-pointer rounded-lg border border-zinc-200 bg-transparent p-0.5 dark:border-zinc-800"
                    />
                    <span className="min-w-0">
                      <span className="block text-[11px] text-zinc-500 dark:text-zinc-400">
                        {label}
                      </span>
                      <span className="block font-mono text-xs text-zinc-950 dark:text-zinc-50">
                        {value}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </section>

          <section>
            <GroupTitle hint="Used for buttons and links on your page.">
              Accent colour
            </GroupTitle>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  set({ accent: null });
                  setCustomAccent("");
                }}
                aria-pressed={!draft.accent}
                title="Use each visitor's own accent"
                className={[
                  "h-7 rounded-full border px-2.5 text-xs font-medium",
                  !draft.accent
                    ? "border-accent text-accent"
                    : "border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400",
                ].join(" ")}
              >
                Visitor&apos;s own
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
                  className="flex size-7 items-center justify-center rounded-full"
                  style={{ backgroundColor: c }}
                >
                  {draft.accent === c && (
                    <Check size={13} strokeWidth={3} className="text-white" />
                  )}
                </button>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="color"
                value={
                  /^#[0-9a-f]{6}$/.test(customAccent) ? customAccent : "#6366f1"
                }
                onChange={(e) => {
                  setCustomAccent(e.target.value);
                  set({ accent: e.target.value });
                }}
                aria-label="Pick a custom accent colour"
                className="size-8 shrink-0 cursor-pointer rounded-lg border border-zinc-200 bg-transparent p-0.5 dark:border-zinc-800"
              />
              <input
                value={customAccent}
                onChange={(e) => {
                  const v = e.target.value.trim().toLowerCase();
                  setCustomAccent(v);
                  if (/^#[0-9a-f]{6}$/.test(v)) set({ accent: v });
                }}
                placeholder="#6366f1"
                aria-label="Custom accent colour"
                className="h-8 min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-2 font-mono text-xs text-zinc-950 outline-none focus:border-accent/50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </div>
            {!accentOk && (
              <p className="mt-2 flex items-start gap-1.5 text-xs text-red-600 dark:text-red-400">
                <TriangleAlert size={13} className="mt-0.5 shrink-0" />
                That colour is too dark or too light to read on both light and
                dark mode.
              </p>
            )}
          </section>

          <section className="space-y-4">
            <GroupTitle>Adjust</GroupTitle>
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
            <div>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Image position
              </p>
              <div className="mt-2 grid grid-cols-3 gap-1 rounded-lg border border-zinc-200 p-0.5 dark:border-zinc-800">
                {IMAGE_POSITIONS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    disabled={!previewImage}
                    aria-pressed={draft.image_position === p.value}
                    onClick={() => set({ image_position: p.value })}
                    className={[
                      "h-7 rounded-md text-xs font-medium transition-colors disabled:opacity-40",
                      draft.image_position === p.value
                        ? "bg-zinc-100 text-zinc-950 dark:bg-zinc-800 dark:text-zinc-50"
                        : "text-zinc-500 dark:text-zinc-400",
                    ].join(" ")}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex items-center justify-between gap-3 text-sm text-zinc-700 dark:text-zinc-300">
              Keep still while scrolling
              <input
                type="checkbox"
                checked={draft.fixed}
                onChange={(e) => set({ fixed: e.target.checked })}
                className="size-4 shrink-0 accent-[var(--accent)]"
              />
            </label>
          </section>
        </div>
      </div>
    </SettingsCard>
  );
}
