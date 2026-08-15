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
};
