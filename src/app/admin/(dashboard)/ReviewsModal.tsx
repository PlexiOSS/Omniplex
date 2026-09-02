"use client";

import { useEffect, useState } from "react";
import { StarRating } from "@/components/reviews/StarRating";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { reviews as reviewsApi } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import type { Review, ReviewTargetType } from "@/lib/api/types";
import { formatRelativeTime } from "@/lib/utils/format";

interface ReviewsModalProps {
  targetType: ReviewTargetType;
  targetId: string;
  entityLabel: string;
  onClose: () => void;
}

/**
 * Read-only view for staff — Popplio's review routes only let the author (or
 * an entity-permission holder, for owner-reviews) edit/delete a review, so
 * there's no staff force-delete action wired up here yet.
 */
export function ReviewsModal({
  targetType,
  targetId,
  entityLabel,
  onClose,
}: ReviewsModalProps) {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    reviewsApi
      .getAll(targetType, targetId)
      .then((data) => setReviews(data.reviews))
      .catch((err) =>
        setError(
          err instanceof ApiError ? err.message : "Failed to load reviews.",
        ),
      );
  }, [targetType, targetId]);

  const roots = (reviews ?? [])
    .filter((r) => !r.parent_id)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

  return (
    <Modal open onClose={onClose} title={`Reviews — ${entityLabel}`}>
      <div className="space-y-4">
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        {!reviews && !error && (
          <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-50" /></div>
        )}

        {reviews && roots.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No reviews yet.
          </p>
        )}

        {roots.map((review) => (
          <div
            key={review.id}
            className="flex items-start gap-3 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800"
          >
            <Avatar
              src={review.author.avatar}
              alt={review.author.username}
              size={28}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                  {review.author.display_name || review.author.username}
                </span>
                {review.owner_review && (
                  <Badge variant="info">Owner response</Badge>
                )}
                <span className="text-xs text-zinc-400 dark:text-zinc-600">
                  {formatRelativeTime(review.created_at)}
                </span>
              </div>
              <StarRating value={review.stars} className="mt-1" />
              <p className="mt-1.5 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                {review.content}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
