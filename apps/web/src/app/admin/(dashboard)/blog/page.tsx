"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AdminEmptyState, AdminListRow } from "@/components/admin/AdminListRow";
import { AdminError, AdminLoading } from "@/components/admin/AdminState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type { BlogPost } from "@/lib/arcadia/types";
import { useAdmin } from "../../AdminContext";
import { AdminPageHeader } from "../../AdminPageHeader";

export default function BlogAdminPage() {
  const router = useRouter();
  const { loginToken, hasPerm } = useAdmin();

  const [posts, setPosts] = useState<BlogPost[] | null>(null);
  const [error, setError] = useState<string | null>(null);
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

  if (error && !posts)
    return (
      <AdminError
        message={error}
        onRetry={() => {
          setError(null);
          load();
        }}
      />
    );

  if (!posts) return <AdminLoading />;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
      <AdminPageHeader
        title="Blog"
        description={
          <>
            Posts published to the public <code>/blog</code> section.
          </>
        }
        action={
          hasPerm("manage_blog") && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => router.push("/admin/blog/new")}
            >
              <Plus size={14} />
              New Post
            </Button>
          )
        }
      />

      {error && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="mt-6 divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
        {posts.length === 0 && <AdminEmptyState message="No blog posts yet." />}
        {posts.map((post) => (
          <AdminListRow
            key={post.itag}
            actions={
              hasPerm("manage_blog") && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      router.push(
                        `/admin/blog/${encodeURIComponent(post.itag)}`,
                      )
                    }
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
              )
            }
          >
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
          </AdminListRow>
        ))}
      </div>
    </div>
  );
}
