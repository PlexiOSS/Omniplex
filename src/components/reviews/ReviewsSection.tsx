"use client";

import {
  Check,
  Link2,
  MessageSquare,
  Pencil,
  Star,
  Trash2,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SignInLink } from "@/components/ui/SignInLink";
import { useAuth } from "@/hooks/useAuth";
import { useEntityPermission } from "@/hooks/useEntityPermission";
import { useHighlightScroll } from "@/hooks/useHighlightScroll";
import { reviews as reviewsApi } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import type { Review, ReviewTargetType } from "@/lib/api/types";
import { formatRelativeTime } from "@/lib/utils/format";
import { StarRating, StarRatingInput } from "./StarRating";

interface ReviewsSectionProps {
  targetType: ReviewTargetType;
  targetId: string;
  initialReviews: Review[];
  highlightId?: string;
}

type Sort = "newest" | "highest" | "lowest";

const SORTS: { key: Sort; label: string }[] = [
  { key: "newest", label: "Newest" },
  { key: "highest", label: "Highest" },
  { key: "lowest", label: "Lowest" },
];

const REPLY_STARS = 5;

const TEXTAREA =
  "w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-400 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600";

const LINK_ACTION =
  "inline-flex h-7 items-center gap-1 rounded-lg px-2 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100";

export function ReviewsSection({
  targetType,
  targetId,
  initialReviews,
  highlightId,
}: ReviewsSectionProps) {
  const { session, isAuthenticated } = useAuth();
  const { hasPerm } = useEntityPermission(
    targetType === "server_template" ? "team" : targetType,
    targetType === "server_template" ? undefined : targetId,
  );
  const canRespondAsOwner = hasPerm("manage_owner_reviews");
  const [reviews, setReviews] = useState(initialReviews);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>("newest");

  const refresh = useCallback(async () => {
    try {
      const data = await reviewsApi.getAll(targetType, targetId);
      setReviews(data.reviews);
    } catch {}
  }, [targetType, targetId]);

  const time = (r: Review) => new Date(r.created_at).getTime();
  const roots = reviews
    .filter((r) => !r.parent_id)
    .sort((a, b) =>
      sort === "highest"
        ? b.stars - a.stars || time(b) - time(a)
        : sort === "lowest"
          ? a.stars - b.stars || time(b) - time(a)
          : time(b) - time(a),
    );
  const repliesOf = (id: string) =>
    reviews.filter((r) => r.parent_id === id).sort((a, b) => time(a) - time(b));

  const myReview = session
    ? roots.find((r) => r.author.id === session.user_id)
    : undefined;

  const avgStars = roots.length
    ? roots.reduce((sum, r) => sum + r.stars, 0) / roots.length
    : 0;
  const distribution = [5, 4, 3, 2, 1].map((n) => ({
    stars: n,
    count: roots.filter((r) => r.stars === n).length,
  }));

  useHighlightScroll(highlightId ? `review-${highlightId}` : undefined);

  function remove(id: string) {
    if (!session) return;
    reviewsApi
      .remove(targetType, targetId, id, session.token)
      .then(refresh)
      .catch(() => {});
  }

  const cta = !isAuthenticated ? (
    <SignInLink className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 text-sm font-medium text-zinc-700 transition-colors hover:border-accent/40 hover:text-accent dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
      Sign in to review
    </SignInLink>
  ) : !myReview && editingId !== "new" ? (
    <Button variant="primary" size="sm" onClick={() => setEditingId("new")}>
      <Star size={14} />
      Write a review
    </Button>
  ) : myReview ? (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => {
        setEditingId(myReview.id);
        document
          .getElementById(`review-${myReview.id}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }}
    >
      <Pencil size={13} />
      Edit your review
    </Button>
  ) : null;

  return (
    <div className="space-y-4">
      {roots.length > 0 ? (
        <section className="grid gap-5 rounded-2xl border border-zinc-200 bg-white p-5 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:gap-8 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-center sm:text-left">
            <p className="text-4xl font-semibold tracking-tight tabular-nums text-zinc-950 dark:text-zinc-50">
              {avgStars.toFixed(1)}
            </p>
            <StarRating
              value={Math.round(avgStars)}
              className="mt-1 justify-center sm:justify-start"
            />
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {roots.length} {roots.length === 1 ? "review" : "reviews"}
            </p>
          </div>
          <ul className="space-y-1.5">
            {distribution.map(({ stars, count }) => (
              <li
                key={stars}
                className="grid grid-cols-[1.5rem_minmax(0,1fr)_1.5rem] items-center gap-2 text-xs"
              >
                <span className="flex items-center gap-0.5 tabular-nums text-zinc-500 dark:text-zinc-400">
                  {stars}
                  <Star size={10} className="fill-current" />
                </span>
                <span className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <span
                    className="block h-full rounded-full bg-amber-400"
                    style={{ width: `${(count / roots.length) * 100}%` }}
                  />
                </span>
                <span className="text-right tabular-nums text-zinc-500 dark:text-zinc-400">
                  {count}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex justify-center sm:justify-end">{cta}</div>
        </section>
      ) : (
        editingId !== "new" && (
          <EmptyState icon={MessageSquare} title="No reviews yet">
            <p>Be the first to share what you think.</p>
            <div className="mt-4 flex justify-center">{cta}</div>
          </EmptyState>
        )
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

      {roots.length > 1 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
            All reviews
          </p>
          <div className="inline-flex rounded-xl border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-950">
            {SORTS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setSort(key)}
                aria-pressed={sort === key}
                className={[
                  "h-7 rounded-lg px-2.5 text-xs font-medium transition-colors",
                  sort === key
                    ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {roots.map((review) => {
        const replies = repliesOf(review.id);
        return (
          <article
            key={review.id}
            className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
          >
            <ReviewItem
              review={review}
              isOwn={review.author.id === session?.user_id}
              isHighlighted={review.id === highlightId}
              isEditing={editingId === review.id}
              onEdit={() => setEditingId(review.id)}
              onCancelEdit={() => setEditingId(null)}
              onDelete={() => remove(review.id)}
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
              replyCount={replies.length}
              targetType={targetType}
              targetId={targetId}
              token={session?.token}
            />

            {(replies.length > 0 || replyingTo === review.id) && (
              <div className="space-y-3 border-t border-zinc-100 bg-zinc-50/60 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-950/30">
                {replies.map((reply) => (
                  <ReviewItem
                    key={reply.id}
                    review={reply}
                    isOwn={reply.author.id === session?.user_id}
                    isHighlighted={reply.id === highlightId}
                    isEditing={editingId === reply.id}
                    onEdit={() => setEditingId(reply.id)}
                    onCancelEdit={() => setEditingId(null)}
                    onDelete={() => remove(reply.id)}
                    onSaved={() => {
                      setEditingId(null);
                      refresh();
                    }}
                    targetType={targetType}
                    targetId={targetId}
                    token={session?.token}
                    isReply
                  />
                ))}
                {replyingTo === review.id && session && (
                  <ReviewForm
                    targetType={targetType}
                    targetId={targetId}
                    token={session.token}
                    parentId={review.id}
                    canPostAsOwner={canRespondAsOwner}
                    onCancel={() => setReplyingTo(null)}
                    onSaved={() => {
                      setReplyingTo(null);
                      refresh();
                    }}
                  />
                )}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

interface ReviewItemProps {
  review: Review;
  isOwn: boolean;
  isHighlighted?: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  onSaved: () => void;
  onReply?: () => void;
  replyCount?: number;
  targetType: ReviewTargetType;
  targetId: string;
  token?: string;
  isReply?: boolean;
}

function ReviewItem({
  review,
  isOwn,
  isHighlighted,
  isEditing,
  onEdit,
  onCancelEdit,
  onDelete,
  onSaved,
  onReply,
  replyCount = 0,
  targetType,
  targetId,
  token,
  isReply,
}: ReviewItemProps) {
  const [armed, setArmed] = useState(false);
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function copyLink() {
    const url = new URL(window.location.href);
    url.searchParams.set("review", review.id);
    url.hash = "";
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  function del() {
    if (!armed) {
      setArmed(true);
      timer.current = setTimeout(() => setArmed(false), 3000);
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    setArmed(false);
    onDelete();
  }

  if (isEditing && token) {
    return (
      <div className={isReply ? "" : "p-5"}>
        <ReviewForm
          targetType={targetType}
          targetId={targetId}
          token={token}
          editingReview={review}
          parentId={isReply ? (review.parent_id ?? undefined) : undefined}
          onCancel={onCancelEdit}
          onSaved={onSaved}
        />
      </div>
    );
  }

  const name = review.author.display_name || review.author.username;

  return (
    <div
      id={`review-${review.id}`}
      className={[
        "scroll-mt-24",
        isReply
          ? review.owner_review
            ? "rounded-xl border border-accent/20 bg-accent/5 p-3"
            : "rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
          : "p-5",
        isHighlighted && "ring-2 ring-accent ring-inset",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex items-start gap-3">
        <Avatar
          src={review.author.avatar}
          alt={review.author.username}
          size={isReply ? 28 : 36}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
              {name}
            </span>
            {review.owner_review && (
              <span className="rounded-md bg-accent/10 px-1.5 py-0.5 text-[11px] font-medium text-accent">
                Owner
              </span>
            )}
            {isOwn && (
              <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                You
              </span>
            )}
            <span className="text-xs text-zinc-400 dark:text-zinc-500">
              {formatRelativeTime(review.created_at)}
            </span>
          </div>
          {!isReply && <StarRating value={review.stars} className="mt-1" />}
          <p className="mt-2 whitespace-pre-wrap wrap-anywhere text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            {review.content}
          </p>
          <div className="-ml-2 mt-2 flex flex-wrap items-center gap-0.5">
            {onReply && (
              <button type="button" onClick={onReply} className={LINK_ACTION}>
                <MessageSquare size={12} />
                Reply
                {replyCount > 0 && (
                  <span className="tabular-nums text-zinc-400">
                    · {replyCount}
                  </span>
                )}
              </button>
            )}
            <button type="button" onClick={copyLink} className={LINK_ACTION}>
              {copied ? <Check size={12} /> : <Link2 size={12} />}
              {copied ? "Copied" : "Copy link"}
            </button>
            {isOwn && (
              <>
                <button type="button" onClick={onEdit} className={LINK_ACTION}>
                  <Pencil size={12} />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={del}
                  className={
                    armed
                      ? "inline-flex h-7 items-center gap-1 rounded-lg bg-red-500/10 px-2 text-xs font-medium text-red-600 dark:text-red-400"
                      : `${LINK_ACTION} hover:text-red-600 dark:hover:text-red-400`
                  }
                >
                  <Trash2 size={12} />
                  {armed ? "Delete?" : "Delete"}
                </button>
              </>
            )}
          </div>
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
  canPostAsOwner?: boolean;
  onCancel: () => void;
  onSaved: () => void;
}

function ReviewForm({
  targetType,
  targetId,
  token,
  parentId,
  editingReview,
  canPostAsOwner = false,
  onCancel,
  onSaved,
}: ReviewFormProps) {
  const isReply = !!parentId;
  const [asOwner, setAsOwner] = useState(canPostAsOwner);
  const [stars, setStars] = useState(
    editingReview?.stars ?? (isReply ? REPLY_STARS : 5),
  );
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
          {
            content,
            stars,
            parent_id: parentId,
            owner_review: isReply && canPostAsOwner && asOwner,
          },
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
      className={[
        "space-y-3",
        isReply
          ? ""
          : "rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900",
      ].join(" ")}
    >
      {!isReply && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
            {editingReview ? "Edit your review" : "Your rating"}
          </p>
          <StarRatingInput value={stars} onChange={setStars} size={22} />
        </div>
      )}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={
          isReply
            ? "Write a reply…"
            : "What did you like? What could be better?"
        }
        rows={isReply ? 2 : 4}
        minLength={5}
        maxLength={4000}
        required
        className={TEXTAREA}
      />
      {isReply && canPostAsOwner && !editingReview && (
        <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
          <input
            type="checkbox"
            checked={asOwner}
            onChange={(e) => setAsOwner(e.target.checked)}
            className="h-4 w-4 accent-accent"
          />
          Post as an owner response
        </label>
      )}
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" size="sm" loading={submitting}>
          {editingReview ? "Save" : isReply ? "Reply" : "Post review"}
        </Button>
      </div>
    </form>
  );
}
