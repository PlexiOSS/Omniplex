"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type { BlogPost } from "@/lib/arcadia/types";
import { AdminPageHeader } from "../../AdminPageHeader";
import { useAdmin } from "../../AdminContext";
import { BlogEditModal } from "./BlogEditModal";

export default function BlogAdminPage() {
  const { loginToken, hasPerm } = useAdmin();

  const [posts, setPosts] = useState<BlogPost[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<BlogPost | "new" | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDeleteItag, setConfirmDeleteItag] = useState<string | null>(
    null,
  );
  const confirmRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    try {
      setPosts(await arcadia.blog.list(loginToken));
    } catch (err) {
      setError(
        err instanceof ArcadiaError ? err.message : "Failed to load posts.",
      );
    }
  }, [loginToken]);

  useEffect(() => {
    load();
  }, [load]);

  function handleDeleteClick(itag: string) {
    if (confirmDeleteItag !== itag) {
      setConfirmDeleteItag(itag);
      confirmRef.current = setTimeout(() => setConfirmDeleteItag(null), 3000);
      return;
    }
    if (confirmRef.current) clearTimeout(confirmRef.current);
    setConfirmDeleteItag(null);
    setDeleting(itag);
    arcadia.blog
      .delete(loginToken, itag)
      .then(load)
      .catch((err) =>
        setError(
          err instanceof ArcadiaError ? err.message : "Failed to delete.",
        ),
      )
      .finally(() => setDeleting(null));
  }

  if (error && !posts) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!posts) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-50" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <AdminPageHeader
        title="Blog"
        description={
          <>
            Posts published to the public <code>/blog</code> section.
          </>
        }
        action={
          hasPerm("manage_blog") && (
            <Button variant="primary" size="sm" onClick={() => setEditing("new")}>
              <Plus size={14} />
              New Post
            </Button>
          )
        }
      />

      {error && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="mt-6 space-y-2">
        {posts.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No blog posts yet.
          </p>
        )}
        {posts.map((post) => (
          <div
            key={post.itag}
            className="flex items-center gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-semibold text-zinc-950 dark:text-zinc-50">
                  {post.title}
                </span>
                {post.draft && <Badge variant="warning">Draft</Badge>}
              </div>
              <p className="mt-0.5 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
                {post.description}
              </p>
              <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-600">
                /blog/{post.slug}
                {post.tags.length > 0 && ` · ${post.tags.join(", ")}`}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {hasPerm("manage_blog") && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditing(post)}
                  >
                    <Pencil size={12} />
                  </Button>
                  <Button
                    variant={
                      confirmDeleteItag === post.itag ? "danger" : "ghost"
                    }
                    size="sm"
                    loading={deleting === post.itag}
                    onClick={() => handleDeleteClick(post.itag)}
                  >
                    <Trash2 size={12} />
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {editing === "new" && (
        <BlogEditModal
          loginToken={loginToken}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}
      {editing && editing !== "new" && (
        <BlogEditModal
          loginToken={loginToken}
          post={editing}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
