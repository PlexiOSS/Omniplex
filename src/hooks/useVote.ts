"use client";

// Copyright (C) 2026 NodeByte LTD

import { useState } from "react";
import { bots, packs, servers, teams } from "@/lib/api";
import { ApiError } from "@/lib/api/client";

type EntityType = "bot" | "server" | "team" | "pack";

export function useVote(type: EntityType, id: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const vote = async (
    userId: string,
    token: string,
    upvote = true,
    captchaToken?: string | null,
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const solution = captchaToken ? { token: captchaToken } : undefined;

      switch (type) {
        case "bot":
          await bots.vote(id, userId, upvote, token, solution);
          break;
        case "server":
          await servers.vote(id, userId, upvote, token, solution);
          break;
        case "team":
          await teams.vote(id, userId, upvote, token);
          break;
        case "pack":
          await packs.vote(id, userId, upvote, token);
          break;
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
