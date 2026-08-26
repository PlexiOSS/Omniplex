"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type { StaffTemplateUpsert } from "@/lib/arcadia/types";

interface TemplateEditModalProps {
  loginToken: string;
  /** Omit for create; pass an existing template for edit. */
  template?: StaffTemplateUpsert;
  onClose: () => void;
  onSaved: () => void;
}

export function TemplateEditModal({
  loginToken,
  template,
  onClose,
  onSaved,
}: TemplateEditModalProps) {
  const isEdit = !!template;
  const [name, setName] = useState(template?.name ?? "");
  const [emoji, setEmoji] = useState(template?.emoji ?? "");
  const [tagsInput, setTagsInput] = useState(
    (template?.tags ?? []).join(", "),
  );
  const [description, setDescription] = useState(
    template?.description ?? "",
  );
  const [type, setType] = useState(template?.type ?? "");
  const [entityType, setEntityType] = useState<"bot" | "server">(
    template?.entity_type ?? "bot",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!name.trim() || !description.trim()) {
      setError("Name and description are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        id: template?.id ?? "",
        name: name.trim(),
        emoji: emoji.trim(),
        tags: tagsInput
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        description: description.trim(),
        type: type.trim(),
        entity_type: entityType,
      };
      if (isEdit) {
        await arcadia.staffTemplates.edit(loginToken, payload);
      } else {
        await arcadia.staffTemplates.create(loginToken, payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ArcadiaError ? err.message : "Failed to save.");
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? "Edit Template" : "Create Template"}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-[80px_1fr] gap-4">
          <Input
            id="template-emoji"
            label="Emoji"
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            placeholder=""
          />
          <Input
            id="template-name"
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="template-description"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Description (the text that gets inserted)
          </label>
          <textarea
            id="template-description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            id="template-type"
            label="Type (optional)"
            value={type}
            onChange={(e) => setType(e.target.value)}
            placeholder="e.g. approval, denial"
          />
          <Input
            id="template-tags"
            label="Tags (comma-separated)"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Used when reviewing
          </p>
          <div className="flex gap-4">
            {(["bot", "server"] as const).map((t) => (
              <label key={t} className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="entity-type"
                  checked={entityType === t}
                  onChange={() => setEntityType(t)}
                  className="h-4 w-4 accent-accent"
                />
                <span className="text-sm capitalize text-zinc-700 dark:text-zinc-300">
                  {t}s
                </span>
              </label>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" loading={saving} onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}
