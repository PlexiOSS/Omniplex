"use client";

import { MessageSquare, Pencil, Star, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SignInLink } from "@/components/ui/SignInLink";
import { useAuth } from "@/hooks/useAuth";
import { reviews as reviewsApi } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import type { Review, ReviewTargetType } from "@/lib/api/types";
import { formatRelativeTime } from "@/lib/utils/format";
import { StarRating, StarRatingInput } from "./StarRating";

interface ReviewsSectionProps {
  targetType: ReviewTargetType;
  targetId: string;
  initialReviews: Review[];
}

export function ReviewsSection({
  targetType,
  targetId,
  initialReviews,
}: ReviewsSectionProps) {
  const { session, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState(initialReviews);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await reviewsApi.getAll(targetType, targetId);
      setReviews(data.reviews);
    } catch {
      // Keep showing the last known-good list on a transient refresh failure.
    }
  }, [targetType, targetId]);

  const roots = reviews
    .filter((r) => !r.parent_id)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  const repliesOf = (id: string) =>
    reviews
      .filter((r) => r.parent_id === id)
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );

  const myReview = session
    ? roots.find((r) => r.author.id === session.user_id)
    : undefined;

  const avgStars = roots.length
    ? roots.reduce((sum, r) => sum + r.stars, 0) / roots.length
    : 0;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
          Reviews
        </h2>
        {roots.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            <StarRating value={Math.round(avgStars)} />
            <span>
              {avgStars.toFixed(1)} ({roots.length})
            </span>
          </div>
        )}
      </div>

      {!isAuthenticated && (
        <div className="rounded-xl border border-zinc-200 p-4 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <SignInLink className="text-accent underline underline-offset-2">
            Sign in
          </SignInLink>{" "}
          to leave a review.
        </div>
      )}

      {isAuthenticated && session && !myReview && editingId !== "new" && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setEditingId("new")}
        >
          <Star size={14} />
          Write a review
        </Button>
      )}

      {isAuthenticated && session && editingId === "new" && (
        <ReviewForm
          targetType={targetType}
          targetId={targetId}
          token={session.token}
          onCancel={() => setEditingId(null)}
          onSaved={() => {
            setEditingId(null);
            refresh();
          }}
        />
      )}

      <div className="mt-4 space-y-4">
        {roots.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MessageSquare
              size={28}
              className="mb-3 text-zinc-300 dark:text-zinc-700"
            />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No reviews yet.
            </p>
            {!isAuthenticated && (
              <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-600">
                <SignInLink className="text-accent underline underline-offset-2">
                  Sign in
                </SignInLink>{" "}
                to be the first to leave one.
              </p>
            )}
            {isAuthenticated && !myReview && (
              <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-600">
                Be the first to leave one.
              </p>
            )}
          </div>
        )}

        {roots.map((review) => (
          <div key={review.id} className="space-y-3">
            <ReviewItem
              review={review}
              isOwn={review.author.id === session?.user_id}
              isEditing={editingId === review.id}
              onEdit={() => setEditingId(review.id)}
              onCancelEdit={() => setEditingId(null)}
              onDelete={() => {
                if (!session) return;
                reviewsApi
                  .remove(targetType, targetId, review.id, session.token)
                  .then(refresh)
                  .catch(() => {});
              }}
              onSaved={() => {
                setEditingId(null);
                refresh();
              }}
              onReply={
                isAuthenticated
                  ? () =>
                      setReplyingTo(replyingTo === review.id ? null : review.id)
                  : undefined
              }
              targetType={targetType}
              targetId={targetId}
              token={session?.token}
            />

            {replyingTo === review.id && session && (
              <div className="ml-9">
                <ReviewForm
                  targetType={targetType}
                  targetId={targetId}
                  token={session.token}
                  parentId={review.id}
                  compact
                  onCancel={() => setReplyingTo(null)}
                  onSaved={() => {
                    setReplyingTo(null);
                    refresh();
                  }}
                />
              </div>
            )}

            {repliesOf(review.id).length > 0 && (
              <div className="ml-9 space-y-3 border-l border-zinc-100 pl-4 dark:border-zinc-900">
                {repliesOf(review.id).map((reply) => (
                  <ReviewItem
                    key={reply.id}
                    review={reply}
                    isOwn={reply.author.id === session?.user_id}
                    isEditing={editingId === reply.id}
                    onEdit={() => setEditingId(reply.id)}
                    onCancelEdit={() => setEditingId(null)}
                    onDelete={() => {
                      if (!session) return;
                      reviewsApi
                        .remove(targetType, targetId, reply.id, session.token)
                        .then(refresh)
                        .catch(() => {});
                    }}
                    onSaved={() => {
                      setEditingId(null);
                      refresh();
                    }}
                    targetType={targetType}
                    targetId={targetId}
                    token={session?.token}
                    compact
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface ReviewItemProps {
  review: Review;
  isOwn: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  onSaved: () => void;
  onReply?: () => void;
  targetType: ReviewTargetType;
  targetId: string;
  token?: string;
  compact?: boolean;
}

function ReviewItem({
  review,
  isOwn,
  isEditing,
  onEdit,
  onCancelEdit,
  onDelete,
  onSaved,
  onReply,
  targetType,
  targetId,
  token,
  compact,
}: ReviewItemProps) {
  if (isEditing && token) {
    return (
      <ReviewForm
        targetType={targetType}
        targetId={targetId}
        token={token}
        editingReview={review}
        compact={compact}
        onCancel={onCancelEdit}
        onSaved={onSaved}
      />
    );
  }

  return (
    <div className="flex items-start gap-3">
      <Avatar
        src={review.author.avatar}
        alt={review.author.username}
        size={32}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
            {review.author.display_name || review.author.username}
          </span>
          {review.owner_review && <Badge variant="info">Owner response</Badge>}
          <span className="text-xs text-zinc-400 dark:text-zinc-600">
            {formatRelativeTime(review.created_at)}
          </span>
        </div>
        <StarRating value={review.stars} className="mt-1" />
        <p className="mt-1.5 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
          {review.content}
        </p>
        <div className="mt-1.5 flex items-center gap-3">
          {onReply && (
            <button
              type="button"
              onClick={onReply}
              className="flex items-center gap-1 text-xs text-zinc-400 transition-colors hover:text-zinc-700 dark:text-zinc-600 dark:hover:text-zinc-300"
            >
              <MessageSquare size={12} />
              Reply
            </button>
          )}
          {isOwn && (
            <>
              <button
                type="button"
                onClick={onEdit}
                className="flex items-center gap-1 text-xs text-zinc-400 transition-colors hover:text-zinc-700 dark:text-zinc-600 dark:hover:text-zinc-300"
              >
                <Pencil size={12} />
                Edit
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="flex items-center gap-1 text-xs text-red-400 transition-colors hover:text-red-600 dark:text-red-500 dark:hover:text-red-400"
              >
                <Trash2 size={12} />
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface ReviewFormProps {
  targetType: ReviewTargetType;
  targetId: string;
  token: string;
  parentId?: string;
  editingReview?: Review;
  compact?: boolean;
  onCancel: () => void;
  onSaved: () => void;
}

function ReviewForm({
  targetType,
  targetId,
  token,
  parentId,
  editingReview,
  compact,
  onCancel,
  onSaved,
}: ReviewFormProps) {
  const [stars, setStars] = useState(editingReview?.stars ?? 5);
  const [content, setContent] = useState(editingReview?.content ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (editingReview) {
        await reviewsApi.edit(
          targetType,
          targetId,
          editingReview.id,
          { content, stars },
          token,
        );
      } else {
        await reviewsApi.create(
          targetType,
          targetId,
          { content, stars, parent_id: parentId, owner_review: false },
          token,
        );
      }
      onSaved();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to save review.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`space-y-2.5 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800 ${compact ? "mt-2" : "mt-3"}`}
    >
      <StarRatingInput value={stars} onChange={setStars} size={18} />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={parentId ? "Write a reply…" : "Share your experience…"}
        rows={compact ? 2 : 3}
        minLength={5}
        maxLength={4000}
        required
        className="w-full resize-none rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 placeholder:text-zinc-400 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600"
      />
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
      <div className="flex items-center gap-2">
        <Button type="submit" variant="primary" size="sm" loading={submitting}>
          {editingReview ? "Save" : "Post"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
