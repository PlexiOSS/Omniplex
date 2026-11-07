"use client";

import { teams } from "@omniplex/core/api";
import { ApiError } from "@omniplex/core/api/client";
import type { Team } from "@omniplex/core/api/types";
import { bannerUrl, teamAvatarUrl } from "@omniplex/core/utils/assets";
import { UploadError, uploadAsset } from "@omniplex/core/utils/upload";
import { Avatar } from "@omniplex/ui/Avatar";
import { Button } from "@omniplex/ui/Button";
import { Input } from "@omniplex/ui/Input";
import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import {
  FormMessage,
  SettingsCard,
  TextArea,
  Toggle,
} from "@/app/dashboard/manage/ManageShell";
import { Banner } from "@/components/ui/Banner";

export function EditInfoSection({
  team,
  userId,
  token,
  onSaved,
}: {
  team: Team;
  userId: string;
  token: string;
  onSaved: () => void;
}) {
  const [name, setName] = useState(team.name);
  const [short, setShort] = useState(team.short ?? "");
  const [tags, setTags] = useState((team.tags ?? []).join(", "));
  const [nsfw, setNsfw] = useState(team.nsfw);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [avatarVersion, setAvatarVersion] = useState<string | null>(
    team.asset_versions?.avatar ?? null,
  );
  const [bannerVersion, setBannerVersion] = useState<string | null>(
    team.asset_versions?.banner ?? null,
  );
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  async function handleImageUpload(
    kind: "team-avatar" | "team-banner",
    file: File,
  ) {
    const setUploading =
      kind === "team-avatar" ? setUploadingAvatar : setUploadingBanner;
    const setVersion =
      kind === "team-avatar" ? setAvatarVersion : setBannerVersion;
    setUploading(true);
    setImageError(null);
    try {
      setVersion(await uploadAsset(kind, team.id, file, { userId, token }));
    } catch (err) {
      setImageError(
        err instanceof UploadError ? err.message : "Upload failed.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await teams.updateTeam(
        team.id,
        {
          name: name.trim(),
          short: short.trim() || undefined,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          nsfw,
        },
        token,
      );
      onSaved();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <SettingsCard
        title="Images"
        description="WebP, PNG, JPEG, or GIF, 5MB max."
        footer={imageError ? <FormMessage error={imageError} /> : undefined}
      >
        <div>
          <Banner
            src={bannerUrl("teams", team.id, bannerVersion)}
            alt={team.name}
            className="h-32 rounded-xl sm:h-40"
          />
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/webp,image/png,image/jpeg,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) handleImageUpload("team-banner", file);
            }}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            loading={uploadingBanner}
            onClick={() => bannerInputRef.current?.click()}
            className="mt-2"
          >
            <Upload size={14} />
            {bannerVersion ? "Replace banner" : "Upload banner"}
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <Avatar
            src={teamAvatarUrl(team.id, avatarVersion)}
            alt={team.name}
            size={56}
          />
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/webp,image/png,image/jpeg,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) handleImageUpload("team-avatar", file);
            }}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            loading={uploadingAvatar}
            onClick={() => avatarInputRef.current?.click()}
          >
            <Upload size={14} />
            {avatarVersion ? "Replace avatar" : "Upload avatar"}
          </Button>
        </div>
      </SettingsCard>

      <form onSubmit={handleSave}>
        <SettingsCard
          title="Profile"
          description="How your team appears on its public page."
          footer={
            <>
              <FormMessage error={error} success={saved ? "Saved." : null} />
              <Button type="submit" variant="primary" loading={saving}>
                Save changes
              </Button>
            </>
          }
        >
          <Input
            id="team-name"
            label="Team name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <TextArea
            id="team-short"
            label="Short description"
            rows={2}
            maxLength={150}
            value={short}
            onChange={setShort}
          />
          <Input
            id="team-tags"
            label="Tags"
            placeholder="comma, separated, tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
          <Toggle checked={nsfw} onChange={setNsfw} label="This team is NSFW" />
        </SettingsCard>
      </form>
    </div>
  );
}
