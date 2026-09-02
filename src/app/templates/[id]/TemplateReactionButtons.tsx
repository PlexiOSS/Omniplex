"use client";

import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useEffect, useState } from "react";
import { SignInLink } from "@/components/ui/SignInLink";
import { useAuth } from "@/hooks/useAuth";
import { serverTemplates } from "@/lib/api";
import { formatCount } from "@/lib/utils/format";

interface TemplateReactionButtonsProps {
  templateId: string;
  initialLikes: number;
  initialDislikes: number;
}

export function TemplateReactionButtons({
  templateId,
  initialLikes,
  initialDislikes,
}: TemplateReactionButtonsProps) {
  const { session, isAuthenticated } = useAuth();
  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);
  // Server-rendered counts are the same for every viewer, but "did *I*
  // react" depends on who's signed in, which the page doesn't know at
  // render time -- fetched client-side once a session exists.
  const [userLiked, setUserLiked] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session) return;
    serverTemplates
      .getReaction(session.user_id, templateId)
      .then((summary) => setUserLiked(summary.user_liked))
      .catch(() => {});
  }, [session, templateId]);

  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
        <span className="flex items-center gap-1">
          <ThumbsUp size={13} />
          {formatCount(likes)}
        </span>
        <span className="flex items-center gap-1">
          <ThumbsDown size={13} />
          {formatCount(dislikes)}
        </span>
        <SignInLink className="text-accent underline underline-offset-2">
          Sign in to react
        </SignInLink>
      </div>
    );
  }

  async function react(liked: boolean) {
    if (!session || loading) return;
    setLoading(true);
    try {
      const summary = await serverTemplates.setReaction(
        session.user_id,
        templateId,
        liked,
        session.token,
      );
      setLikes(summary.likes);
      setDislikes(summary.dislikes);
      setUserLiked(summary.user_liked);
    } catch {
      // Keep the last known-good counts on a transient failure.
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={loading}
        onClick={() => react(true)}
        className={[
          "inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
          userLiked === true
            ? "border-accent/40 bg-accent/10 text-accent"
            : "border-zinc-200 text-zinc-600 hover:border-accent/40 hover:bg-accent/5 dark:border-zinc-800 dark:text-zinc-400",
        ].join(" ")}
      >
        <ThumbsUp
          size={14}
          className={userLiked === true ? "fill-current" : undefined}
        />
        {formatCount(likes)}
      </button>
      <button
        type="button"
        disabled={loading}
        onClick={() => react(false)}
        className={[
          "inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
          userLiked === false
            ? "border-red-400/40 bg-red-500/10 text-red-600 dark:text-red-400"
            : "border-zinc-200 text-zinc-600 hover:border-red-400/40 hover:bg-red-500/5 dark:border-zinc-800 dark:text-zinc-400",
        ].join(" ")}
      >
        <ThumbsDown
          size={14}
          className={userLiked === false ? "fill-current" : undefined}
        />
        {formatCount(dislikes)}
      </button>
    </div>
  );
}
