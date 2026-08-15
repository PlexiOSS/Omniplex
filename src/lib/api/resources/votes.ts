import { client } from "../client";
import type {
  EntityVoteRedeemLogSummary,
  TargetType,
  VoteCreditTierRedeemSummary,
} from "../types";

export const votesResource = {
  getCreditSummary: (targetType: TargetType, targetId: string) =>
    client.get<VoteCreditTierRedeemSummary>(
      `/${targetType}/${targetId}/votes/credit-tiers`,
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
