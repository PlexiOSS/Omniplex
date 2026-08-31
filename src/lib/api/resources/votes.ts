import { client } from "../client";
import type {
  EntityVote,
  EntityVoteRedeemLogSummary,
  PagedResult,
  TargetType,
  VoteCreditTier,
  VoteCreditTierRedeemSummary,
  VoterLeaderboardEntry,
} from "../types";

export const votesResource = {
  /** Public, no auth needed. Most active voters, all-time, by total
   * upvotes cast. Defaults to top 10 server-side; capped at 50. */
  getLeaderboard: (limit?: number) =>
    client.get<VoterLeaderboardEntry[]>(
      `/votes/leaderboard${limit ? `?limit=${limit}` : ""}`,
      { cache: "no-store" },
    ),

  getCreditSummary: (targetType: TargetType, targetId: string) =>
    client.get<VoteCreditTierRedeemSummary>(
      `/${targetType}/${targetId}/votes/credit-tiers`,
      { cache: "no-store" },
    ),

  /** The sitewide tier catalog (not scoped to one entity) — same rows the
   * per-entity credit summary's `tiers` field is drawn from, useful for
   * showing the full ladder before a user has picked/owns an entity. */
  getGeneralCreditTiers: (targetType?: TargetType) =>
    client.get<VoteCreditTier[]>(
      `/votes/credit-tiers${targetType ? `?target_type=${targetType}` : ""}`,
      { cache: "no-store" },
    ),

  /** A user's individual vote history on one entity (5/page) — distinct
   * from the credit summary, which is an aggregate. */
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

  /** Converts up to `votes` of the entity's votes into spendable credits. */
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

  /** Public, no auth needed. Bare Discord snowflakes, one per distinct voter — no
   * usernames/avatars/timestamps. Omitting `page` returns every voter unpaginated;
   * pass page=1 (100/page) to get a real total via response length. */
  getUserList: (targetType: TargetType, targetId: string, page?: number) =>
    client.get<string[]>(
      `/${targetType}/${targetId}/votes/user-list${page ? `?page=${page}` : ""}`,
      { cache: "no-store" },
    ),
};
