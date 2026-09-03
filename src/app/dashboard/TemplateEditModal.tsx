"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { TagPicker } from "@/components/ui/TagPicker";
import { serverTemplates } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import type { ServerTemplate } from "@/lib/api/types";
import { SERVER_TAGS } from "@/lib/constants/tags";

interface TemplateEditModalProps {
  template: ServerTemplate;
  userId: string;
  token: string;
  onClose: () => void;
  onSaved: () => void;
}

/** Edit flow for server templates -- name/code are pulled from Discord's
 * own template metadata and aren't independently editable here, same as
 * channels/roles (a separate, larger feature). Just the submitter's own
 * description, tags, and NSFW flag. */
export function TemplateEditModal({
  template,
  userId,
  token,
  onClose,
  onSaved,
}: TemplateEditModalProps) {
  const [form, setForm] = useState({
    short: template.short,
    tags: template.tags,
    nsfw: template.nsfw,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await serverTemplates.update(
        userId,
        template.id,
        {
          short: form.short.trim(),
          tags: form.tags,
          nsfw: form.nsfw,
        },
        token,
      );
      onSaved();
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to save changes.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={`Edit "${template.name}"`}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="template-short"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Description
          </label>
          <textarea
            id="template-short"
            rows={3}
            maxLength={150}
            value={form.short}
            onChange={(e) => setForm((f) => ({ ...f, short: e.target.value }))}
            className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
            required
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Tags
          </p>
          <TagPicker
            available={SERVER_TAGS}
            selected={form.tags}
            onChange={(tags) => setForm((f) => ({ ...f, tags }))}
          />
        </div>

        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={form.nsfw}
            onChange={(e) => setForm((f) => ({ ...f, nsfw: e.target.checked }))}
            className="h-4 w-4 rounded border-zinc-300 accent-accent dark:border-zinc-700"
          />
          <span className="text-sm text-zinc-700 dark:text-zinc-300">
            This template contains NSFW content
          </span>
        </label>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={saving}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
