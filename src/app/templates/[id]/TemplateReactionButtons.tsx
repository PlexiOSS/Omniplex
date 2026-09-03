"use client";

import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
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
  const [pendingDir, setPendingDir] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    if (!session) return;
    serverTemplates
      .getReaction(session.user_id, templateId)
      .then((summary) => setUserLiked(summary.user_liked))
      .catch(() => {});
  }, [session, templateId]);

  if (!isAuthenticated) {
    return (
      <SignInLink className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 text-sm font-medium text-zinc-700 transition-colors hover:border-accent/40 hover:bg-accent/5 hover:text-accent dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-accent/40 dark:hover:bg-accent/10">
        <ThumbsUp size={14} />
        Sign in to react
      </SignInLink>
    );
  }

  async function react(liked: boolean) {
    if (!session || loading) return;
    setLoading(true);
    setPendingDir(liked ? "up" : "down");
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
      setPendingDir(null);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={userLiked === true ? "secondary" : "primary"}
        size="md"
        loading={loading && pendingDir === "up"}
        disabled={loading}
        onClick={() => react(true)}
        className={[
          "flex-1",
          userLiked === true
            ? "border-accent/40 bg-accent/10 text-accent hover:border-accent/40 hover:bg-accent/10 hover:text-accent"
            : "",
        ].join(" ")}
      >
        <ThumbsUp
          size={14}
          className={userLiked === true ? "fill-current" : undefined}
        />
        {userLiked === true ? "Liked" : `Like · ${formatCount(likes)}`}
      </Button>
      <Button
        variant={userLiked === false ? "danger" : "secondary"}
        size="md"
        loading={loading && pendingDir === "down"}
        disabled={loading}
        onClick={() => react(false)}
        aria-label="Downvote"
        className="shrink-0"
      >
        <ThumbsDown
          size={14}
          className={userLiked === false ? "fill-current" : undefined}
        />
      </Button>
    </div>
  );
}
