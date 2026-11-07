"use client";

import { vanity } from "@omniplex/core/api";
import { ApiError } from "@omniplex/core/api/client";
import { bannerUrl } from "@omniplex/core/utils/assets";
import { UploadError, uploadAsset } from "@omniplex/core/utils/upload";
import { Button } from "@omniplex/ui/Button";
import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Banner } from "@/components/ui/Banner";
import { FormMessage, SettingsCard } from "../../manage/ManageShell";

import type { SectionProps } from "./DetailsSection";

export function AppearanceSection({
  bot,
  userId,
  token,
  onSaved,
}: SectionProps) {
  const [bannerVersion, setBannerVersion] = useState<string | null>(
    bot.asset_versions?.banner ?? null,
  );
  const [uploading, setUploading] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [vanityCode, setVanityCode] = useState(bot.vanity);
  const [savingVanity, setSavingVanity] = useState(false);
  const [vanityError, setVanityError] = useState<string | null>(null);
  const [vanitySaved, setVanitySaved] = useState(false);

  async function handleBanner(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setBannerError(null);
    try {
      setBannerVersion(
        await uploadAsset("bot-banner", bot.bot_id, file, { userId, token }),
      );
      onSaved();
    } catch (err) {
      setBannerError(
        err instanceof UploadError ? err.message : "Upload failed.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function saveVanity(e: React.FormEvent) {
    e.preventDefault();
    const code = vanityCode.trim();
    if (!code || code === bot.vanity) return;
    setSavingVanity(true);
    setVanityError(null);
    try {
      await vanity.update("bot", bot.bot_id, code, token);
      setVanitySaved(true);
      onSaved();
    } catch (err) {
      setVanityError(
        err instanceof ApiError
          ? err.message
          : "Couldn't change the vanity URL.",
      );
    } finally {
      setSavingVanity(false);
    }
  }

  return (
    <div className="space-y-6">
      <SettingsCard
        title="Banner"
        description="Shown at the top of your bot's page and on its card. WebP, PNG, JPEG or GIF, up to 5MB. Without one, your bot's Discord banner is used."
        footer={
          <>
            <FormMessage error={bannerError} />
            <input
              ref={inputRef}
              type="file"
              accept="image/webp,image/png,image/jpeg,image/gif"
              className="hidden"
              onChange={handleBanner}
            />
            <Button
              type="button"
              variant="secondary"
              loading={uploading}
              onClick={() => inputRef.current?.click()}
            >
              <Upload size={14} />
              {bannerVersion ? "Replace banner" : "Upload banner"}
            </Button>
          </>
        }
      >
        <Banner
          src={bannerUrl("bots", bot.bot_id, bannerVersion)}
          alt={bot.user.username}
          className="h-36 rounded-xl sm:h-48"
        />
      </SettingsCard>

      <form onSubmit={saveVanity}>
        <SettingsCard
          title="Vanity URL"
          description="A custom link for your bot. Lowercase, spaces become hyphens, and each one can only be used once. The ID-based link keeps working."
          footer={
            <>
              <FormMessage
                error={vanityError}
                success={vanitySaved ? "Vanity URL updated." : null}
              />
              <Button
                type="submit"
                variant="primary"
                loading={savingVanity}
                disabled={
                  !vanityCode.trim() || vanityCode.trim() === bot.vanity
                }
              >
                Save vanity URL
              </Button>
            </>
          }
        >
          <div className="flex items-center overflow-hidden rounded-xl border border-zinc-200 focus-within:border-zinc-400 dark:border-zinc-800 dark:focus-within:border-zinc-600">
            <span className="shrink-0 border-r border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
              omniplex.gg/bots/
            </span>
            <input
              aria-label="Vanity URL"
              value={vanityCode}
              onChange={(e) => {
                setVanityCode(e.target.value);
                setVanitySaved(false);
              }}
              className="min-w-0 flex-1 bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none dark:bg-zinc-900 dark:text-zinc-50"
            />
          </div>
        </SettingsCard>
      </form>
    </div>
  );
}
