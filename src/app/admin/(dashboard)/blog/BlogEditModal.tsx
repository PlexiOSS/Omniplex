"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { TagPicker } from "@/components/ui/TagPicker";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type { BlogPost } from "@/lib/arcadia/types";

interface BlogEditModalProps {
  loginToken: string;
  /** Omit for create; pass an existing post for edit. */
  post?: BlogPost;
  onClose: () => void;
  onSaved: () => void;
}

export function BlogEditModal({
  loginToken,
  post,
  onClose,
  onSaved,
}: BlogEditModalProps) {
  const isEdit = !!post;
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [title, setTitle] = useState(post?.title ?? "");
  const [description, setDescription] = useState(post?.description ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [tags, setTags] = useState<string[]>(post?.tags ?? []);
  const [draft, setDraft] = useState(post?.draft ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!slug.trim() || !title.trim() || !content.trim()) {
      setError("Slug, title, and content are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (isEdit && post) {
        await arcadia.blog.edit(loginToken, {
          itag: post.itag,
          slug: slug.trim(),
          title: title.trim(),
          description: description.trim(),
          content,
          tags,
          draft,
        });
      } else {
        await arcadia.blog.create(loginToken, {
          slug: slug.trim(),
          title: title.trim(),
          description: description.trim(),
          content,
          tags,
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ArcadiaError ? err.message : "Failed to save.");
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={isEdit ? "Edit Post" : "New Post"}>
      <div className="space-y-4">
        <Input
          id="blog-title"
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <Input
          id="blog-slug"
          label="Slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="my-post-slug"
          required
        />
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="blog-description"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Description
          </label>
          <textarea
            id="blog-description"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="blog-content"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Content (Markdown/HTML)
          </label>
          <textarea
            id="blog-content"
            rows={12}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2.5 font-mono text-sm text-zinc-950 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
            required
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Tags
          </p>
          <TagPicker available={[]} selected={tags} onChange={setTags} />
        </div>

        {isEdit && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={draft}
              onChange={(e) => setDraft(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 accent-accent dark:border-zinc-700"
            />
            <span className="text-sm text-zinc-700 dark:text-zinc-300">
              Draft (hidden from the public blog)
            </span>
          </label>
        )}
        {!isEdit && (
          <p className="text-xs text-zinc-400 dark:text-zinc-600">
            New posts publish immediately — you can mark it a draft after
            creating it.
          </p>
        )}

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
