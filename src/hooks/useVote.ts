"use client";

import { useState } from "react";
import { bots, servers } from "@/lib/api";
import { ApiError } from "@/lib/api/client";

type EntityType = "bot" | "server";

export function useVote(type: EntityType, id: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const vote = async (
    userId: string,
    token: string,
    upvote = true,
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (type === "bot") {
        await bots.vote(id, userId, upvote, token);
      } else {
        await servers.vote(id, userId, upvote, token);
      }
      setSuccess(true);
      return true;
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Failed to submit vote";
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { vote, loading, error, success };
}
