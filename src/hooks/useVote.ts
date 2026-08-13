"use client";

import { useState } from "react";
import { bots, captcha, servers } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import type { CaptchaSolution } from "@/lib/api/types";
import { solveCaptcha } from "@/lib/captcha/pow";

type EntityType = "bot" | "server";

export function useVote(type: EntityType, id: string) {
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const vote = async (
    userId: string,
    token: string,
    upvote = true,
    requiresCaptcha = false,
  ): Promise<boolean> => {
    setLoading(true);
    setVerifying(false);
    setError(null);
    setSuccess(false);

    try {
      let solution: CaptchaSolution | undefined;

      if (requiresCaptcha) {
        setVerifying(true);
        try {
          const challenge = await captcha.getVoteChallenge();
          solution = await solveCaptcha(challenge);
        } finally {
          setVerifying(false);
        }
      }

      if (type === "bot") {
        await bots.vote(id, userId, upvote, token, solution);
      } else {
        await servers.vote(id, userId, upvote, token, solution);
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

  return { vote, loading, verifying, error, success };
}
