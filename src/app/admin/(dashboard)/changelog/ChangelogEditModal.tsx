"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type { ChangelogEntry, ChangelogProject } from "@/lib/arcadia/types";

interface ChangelogEditModalProps {
  loginToken: string;
  /** Omit for create; pass an existing entry for edit. */
  entry?: ChangelogEntry;
  onClose: () => void;
  onSaved: () => void;
}

/** Splits a newline-separated textarea into a clean string array. */
function linesToArray(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function ChangelogEditModal({
  loginToken,
  entry,
  onClose,
  onSaved,
}: ChangelogEditModalProps) {
  const isEdit = !!entry;
  const [project, setProject] = useState<ChangelogProject>(
    entry?.project ?? "popplio",
  );
  const [version, setVersion] = useState(entry?.version ?? "");
  const [extraDescription, setExtraDescription] = useState(
    entry?.extra_description ?? "",
  );
  const [added, setAdded] = useState((entry?.added ?? []).join("\n"));
  const [updated, setUpdated] = useState((entry?.updated ?? []).join("\n"));
  const [fixed, setFixed] = useState((entry?.fixed ?? []).join("\n"));
  const [removed, setRemoved] = useState((entry?.removed ?? []).join("\n"));
  const [prerelease, setPrerelease] = useState(entry?.prerelease ?? false);
  const [published, setPublished] = useState(entry?.published ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [baseRef, setBaseRef] = useState("");
  const [headRef, setHeadRef] = useState("");
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    if (!baseRef.trim() || !headRef.trim()) {
      setError("Both a base and head ref are required to generate.");
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const draft = await arcadia.changelog.generate(loginToken, {
        project,
        base: baseRef.trim(),
        head: headRef.trim(),
      });
      setAdded(draft.added.join("\n"));
      setUpdated(draft.updated.join("\n"));
      setFixed(draft.fixed.join("\n"));
      setRemoved(draft.removed.join("\n"));
      if (draft.extra_description) setExtraDescription(draft.extra_description);
    } catch (err) {
      setError(
        err instanceof ArcadiaError ? err.message : "Failed to generate.",
      );
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!version.trim()) {
      setError("Version is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        project,
        version: version.trim(),
        extra_description: extraDescription.trim(),
        prerelease,
        published,
        added: linesToArray(added),
        updated: linesToArray(updated),
        fixed: linesToArray(fixed),
        removed: linesToArray(removed),
      };
      if (isEdit && entry) {
        await arcadia.changelog.edit(loginToken, {
          itag: entry.itag,
          ...payload,
        });
      } else {
        await arcadia.changelog.create(loginToken, payload);
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
      title={isEdit ? "Edit Changelog Entry" : "New Changelog Entry"}
    >
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1.5">
            <label
              htmlFor="changelog-project"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Project
            </label>
            <select
              id="changelog-project"
              value={project}
              onChange={(e) => setProject(e.target.value as ChangelogProject)}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
            >
              <option value="popplio">Popplio</option>
              <option value="omniplex">Omniplex</option>
            </select>
          </div>
          <div className="flex-1">
            <Input
              id="changelog-version"
              label="Version"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="1.5.0"
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded-xl border border-dashed border-zinc-200 p-3 dark:border-zinc-800">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Generate from GitHub
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-600">
            Pulls the merged PRs between two refs on {project}&apos;s repo and
            drafts the fields below from them. Review before saving — this
            overwrites whatever&apos;s currently in Added/Updated/Fixed/Removed.
          </p>
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-32 flex-1">
              <Input
                id="changelog-gen-base"
                label="Base ref"
                value={baseRef}
                onChange={(e) => setBaseRef(e.target.value)}
                placeholder="v1.4.0"
              />
            </div>
            <div className="min-w-32 flex-1">
              <Input
                id="changelog-gen-head"
                label="Head ref"
                value={headRef}
                onChange={(e) => setHeadRef(e.target.value)}
                placeholder="v1.5.0"
              />
            </div>
            <Button
              variant="secondary"
              size="sm"
              loading={generating}
              onClick={handleGenerate}
            >
              Generate
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="changelog-extra-description"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Extra description
          </label>
          <textarea
            id="changelog-extra-description"
            rows={2}
            value={extraDescription}
            onChange={(e) => setExtraDescription(e.target.value)}
            placeholder="Optional freeform notes about this release"
            className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
          />
        </div>

        {(
          [
            ["added", "Added", added, setAdded],
            ["updated", "Updated", updated, setUpdated],
            ["fixed", "Fixed", fixed, setFixed],
            ["removed", "Removed", removed, setRemoved],
          ] as const
        ).map(([key, label, value, setValue]) => (
          <div key={key} className="flex flex-col gap-1.5">
            <label
              htmlFor={`changelog-${key}`}
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              {label}{" "}
              <span className="font-normal text-zinc-400 dark:text-zinc-600">
                (one per line)
              </span>
            </label>
            <textarea
              id={`changelog-${key}`}
              rows={3}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2.5 font-mono text-sm text-zinc-950 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
            />
          </div>
        ))}

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={prerelease}
              onChange={(e) => setPrerelease(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 accent-accent dark:border-zinc-700"
            />
            <span className="text-sm text-zinc-700 dark:text-zinc-300">
              Prerelease
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 accent-accent dark:border-zinc-700"
            />
            <span className="text-sm text-zinc-700 dark:text-zinc-300">
              Published (visible on the public changelog)
            </span>
          </label>
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
