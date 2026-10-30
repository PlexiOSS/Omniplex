import { client } from "../client";
import type {
  EntityVote,
  EntityVoteRedeemLogSummary,
  EntityVoterList,
  PagedResult,
  TargetType,
  VoteCreditTier,
  VoteCreditTierRedeemSummary,
  VoterLeaderboardEntry,
  VoterLeaderboardPeriod,
  VoterLeaderboardRank,
} from "../types";

export const votesResource = {
  getLeaderboard: (limit?: number, period: VoterLeaderboardPeriod = "all") => {
    const params = new URLSearchParams({ period });
    if (limit) params.set("limit", String(limit));
    return client.get<VoterLeaderboardEntry[]>(`/votes/leaderboard?${params}`, {
      cache: "no-store",
    });
  },

  getLeaderboardRank: (
    userId: string,
    period: VoterLeaderboardPeriod = "all",
  ) =>
    client.get<VoterLeaderboardRank>(
      `/votes/leaderboard/users/${encodeURIComponent(userId)}?period=${period}`,
      { cache: "no-store" },
    ),

  getCreditSummary: (targetType: TargetType, targetId: string) =>
    client.get<VoteCreditTierRedeemSummary>(
      `/${targetType}/${targetId}/votes/credit-tiers`,
      { cache: "no-store" },
    ),

  getGeneralCreditTiers: (targetType?: TargetType) =>
    client.get<VoteCreditTier[]>(
      `/votes/credit-tiers${targetType ? `?target_type=${targetType}` : ""}`,
      { cache: "no-store" },
    ),

  getUserVotes: (
    userId: string,
    targetType: TargetType,
    targetId: string,
    page = 1,
  ) =>
    client.get<PagedResult<EntityVote[]>>(
      `/users/${userId}/${targetType}/${targetId}/votes/@all?page=${page}`,
      { cache: "no-store" },
    ),

  getRedeemLogs: (targetType: TargetType, targetId: string) =>
    client.get<EntityVoteRedeemLogSummary>(
      `/${targetType}/${targetId}/votes/credits`,
      { cache: "no-store" },
    ),

  redeemCredits: (
    targetType: TargetType,
    targetId: string,
    votesToRedeem: number,
    token: string,
  ) =>
    client.post<void>(
      `/${targetType}/${targetId}/votes/credits?votes=${votesToRedeem}`,
      {},
      { token },
    ),

  getVoters: (
    targetType: TargetType,
    targetId: string,
    limit?: number,
    token?: string,
  ) =>
    client.get<EntityVoterList>(
      `/${targetType}/${targetId}/votes/voters${limit ? `?limit=${limit}` : ""}`,
      { token, cache: "no-store" },
    ),

  getUserList: (
    targetType: TargetType,
    targetId: string,
    page?: number,
    token?: string,
  ) =>
    client.get<string[]>(
      `/${targetType}/${targetId}/votes/user-list${page ? `?page=${page}` : ""}`,
      { token, cache: "no-store" },
    ),
};
