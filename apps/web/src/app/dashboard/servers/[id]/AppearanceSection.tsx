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
  server,
  userId,
  token,
  onSaved,
}: SectionProps) {
  const [bannerVersion, setBannerVersion] = useState<string | null>(
    server.asset_versions?.banner ?? null,
  );
  const [uploading, setUploading] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [vanityCode, setVanityCode] = useState(server.vanity);
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
        await uploadAsset("server-banner", server.server_id, file, {
          userId,
          token,
        }),
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
    if (!code || code === server.vanity) return;
    setSavingVanity(true);
    setVanityError(null);
    try {
      await vanity.update("server", server.server_id, code, token);
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
        description="Shown at the top of your server's page and on its card. WebP, PNG, JPEG or GIF, up to 5MB."
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
          src={bannerUrl("servers", server.server_id, bannerVersion)}
          alt={server.name}
          className="h-36 rounded-xl sm:h-48"
        />
      </SettingsCard>

      <form onSubmit={saveVanity}>
        <SettingsCard
          title="Vanity URL"
          description="A custom link for your server. Lowercase, spaces become hyphens, and each one can only be used once."
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
                  !vanityCode.trim() || vanityCode.trim() === server.vanity
                }
              >
                Save vanity URL
              </Button>
            </>
          }
        >
          <div className="flex items-center overflow-hidden rounded-xl border border-zinc-200 focus-within:border-zinc-400 dark:border-zinc-800 dark:focus-within:border-zinc-600">
            <span className="shrink-0 border-r border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
              omniplex.gg/servers/
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
