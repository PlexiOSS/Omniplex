"use client";

import { serverTemplates } from "@omniplex/core/api";
import { ApiError } from "@omniplex/core/api/client";
import type { ServerTemplate } from "@omniplex/core/api/types";
import { formatRelativeTime } from "@omniplex/core/utils/format";
import { UploadError, uploadAsset } from "@omniplex/core/utils/upload";
import { Button } from "@omniplex/ui/Button";
import { Input } from "@omniplex/ui/Input";
import { TagPicker } from "@omniplex/ui/TagPicker";
import { RefreshCw, Trash2, TriangleAlert, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { TemplateIcon } from "@/components/templates/TemplateIcon";
import { SERVER_TAGS } from "@/lib/constants/tags";
import {
  FormMessage,
  SettingsCard,
  TextArea,
  Toggle,
} from "../../manage/ManageShell";

export interface TemplateSectionProps {
  template: ServerTemplate;
  userId: string;
  token: string;
  onSaved: () => void;
}

function errorMessage(err: unknown, fallback: string) {
  return err instanceof ApiError ? err.message : fallback;
}

export function DetailsSection({
  template,
  userId,
  token,
  onSaved,
}: TemplateSectionProps) {
  const [short, setShort] = useState(template.short);
  const [tags, setTags] = useState(template.tags);
  const [nsfw, setNsfw] = useState(template.nsfw);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await serverTemplates.update(
        userId,
        template.id,
        { short: short.trim(), tags, nsfw },
        token,
      );
      setSaved(true);
      onSaved();
    } catch (err) {
      setError(errorMessage(err, "Couldn't save your changes."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save}>
      <SettingsCard
        title="Details"
        description="The name comes from Discord and updates when the template syncs. Everything else here is yours to change."
        footer={
          <>
            <FormMessage
              error={error}
              success={saved ? "Changes saved." : null}
            />
            <Button
              type="submit"
              variant="primary"
              loading={saving}
              disabled={!short.trim()}
            >
              Save changes
            </Button>
          </>
        }
      >
        <TextArea
          id="template-short"
          label="Description"
          hint="Shown on the template's card and page. Up to 150 characters."
          value={short}
          onChange={setShort}
          maxLength={150}
          required
        />
        <div>
          <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Tags
          </p>
          <TagPicker
            available={SERVER_TAGS}
            selected={tags}
            onChange={setTags}
          />
        </div>
        <Toggle
          checked={nsfw}
          onChange={setNsfw}
          label="NSFW"
          description="The server this template builds is meant for adults."
        />
      </SettingsCard>
    </form>
  );
}

export function IconSection({
  template,
  userId,
  token,
  onSaved,
}: TemplateSectionProps) {
  const [version, setVersion] = useState(template.icon_version);
  const [busy, setBusy] = useState<"upload" | "remove" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy("upload");
    setError(null);
    try {
      setVersion(
        await uploadAsset("template-icon", template.id, file, {
          userId,
          token,
        }),
      );
      onSaved();
    } catch (err) {
      setError(err instanceof UploadError ? err.message : "Upload failed.");
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    setBusy("remove");
    setError(null);
    try {
      await serverTemplates.setIcon(userId, template.id, null, token);
      setVersion(null);
      onSaved();
    } catch (err) {
      setError(errorMessage(err, "Couldn't remove the icon."));
    } finally {
      setBusy(null);
    }
  }

  return (
    <SettingsCard
      title="Icon"
      description="Shown on the template's card and page. WebP, PNG, JPEG or GIF, up to 5MB. It's cropped to a square."
      footer={
        <>
          <FormMessage error={error} />
          <input
            ref={inputRef}
            type="file"
            accept="image/webp,image/png,image/jpeg,image/gif"
            className="hidden"
            onChange={upload}
          />
          {version && (
            <Button
              type="button"
              variant="ghost"
              loading={busy === "remove"}
              disabled={busy !== null}
              onClick={remove}
            >
              <Trash2 size={14} />
              Remove
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            loading={busy === "upload"}
            disabled={busy !== null}
            onClick={() => inputRef.current?.click()}
          >
            <Upload size={14} />
            {version ? "Replace icon" : "Upload icon"}
          </Button>
        </>
      }
    >
      <div className="flex items-center gap-4">
        <TemplateIcon
          templateId={template.id}
          version={version}
          name={template.name}
          size={96}
        />
        <div className="flex items-center gap-3">
          <TemplateIcon
            templateId={template.id}
            version={version}
            name={template.name}
            size={40}
          />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            How it looks on cards
          </p>
        </div>
      </div>
    </SettingsCard>
  );
}

export function SyncSection({
  template,
  userId,
  token,
  onSaved,
}: TemplateSectionProps) {
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [synced, setSynced] = useState(false);

  async function sync() {
    setSyncing(true);
    setError(null);
    setSynced(false);
    try {
      await serverTemplates.sync(userId, template.id, token);
      setSynced(true);
    } catch (err) {
      setError(errorMessage(err, "Couldn't sync with Discord."));
    } finally {
      setSyncing(false);
      onSaved();
    }
  }

  return (
    <div className="space-y-6">
      {template.unavailable && (
        <Notice>
          This template no longer exists on Discord, so it&apos;s hidden from
          the templates list. If you made a new template for the same server,
          submit that one instead, or delete this listing.
        </Notice>
      )}
      {!template.unavailable && template.out_of_date && (
        <Notice>
          Your server has changes that aren&apos;t in the template yet. In
          Discord, open Server Settings, then Server Template, and click Sync
          Template. Then sync here to show the changes on Omniplex.
        </Notice>
      )}
      <SettingsCard
        title="Sync with Discord"
        description="Omniplex checks every template about once a day. Sync now to pick up a new name, channels, roles or usage count straight away."
        footer={
          <>
            <FormMessage error={error} success={synced ? "Synced." : null} />
            <Button
              type="button"
              variant="primary"
              loading={syncing}
              onClick={sync}
            >
              <RefreshCw size={14} />
              Sync now
            </Button>
          </>
        }
      >
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <Fact
            label="Last checked"
            value={
              template.synced_at
                ? formatRelativeTime(template.synced_at)
                : "Not yet"
            }
          />
          <Fact
            label="Last changed on Discord"
            value={
              template.source_updated_at
                ? formatRelativeTime(template.source_updated_at)
                : "Unknown"
            }
          />
          <Fact
            label="Contents"
            value={`${template.channel_count} channels, ${template.role_count} roles`}
          />
          <Fact
            label="Status"
            value={
              template.unavailable
                ? "Deleted on Discord"
                : template.out_of_date
                  ? "Server has unsynced changes"
                  : "Up to date"
            }
          />
        </dl>
      </SettingsCard>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="mt-0.5 font-medium text-zinc-950 dark:text-zinc-50">
        {value}
      </dd>
    </div>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
      <TriangleAlert size={18} className="mt-0.5 shrink-0" />
      <p>{children}</p>
    </div>
  );
}

export function DangerSection({
  template,
  userId,
  token,
}: TemplateSectionProps) {
  const router = useRouter();
  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove(e: React.FormEvent) {
    e.preventDefault();
    if (confirm !== template.name) return;
    setDeleting(true);
    setError(null);
    try {
      await serverTemplates.delete(userId, template.id, token);
      router.push("/dashboard?tab=templates");
    } catch (err) {
      setError(errorMessage(err, "Couldn't delete the template."));
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={remove}>
      <SettingsCard
        tone="danger"
        title="Delete this template"
        description="Removes the listing, its likes and reviews from Omniplex. The template on Discord isn't touched. This can't be undone."
        footer={
          <>
            <FormMessage error={error} />
            <Button
              type="submit"
              variant="danger"
              loading={deleting}
              disabled={confirm !== template.name}
            >
              Delete template
            </Button>
          </>
        }
      >
        <Input
          id="delete-confirm"
          label={`Type ${template.name} to confirm`}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </SettingsCard>
    </form>
  );
}
