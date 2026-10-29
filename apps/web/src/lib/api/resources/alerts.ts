import { client } from "../client";
import type {
  AlertList,
  AlertPatchAction,
  FeaturedUserAlerts,
  PagedResult,
} from "../types";

export const alertsResource = {
  list: (userId: string, token: string, page = 1) =>
    client.get<PagedResult<AlertList>>(`/users/${userId}/alerts?page=${page}`, {
      token,
      cache: "no-store",
    }),

  getFeatured: (
    userId: string,
    token: string,
    ackedCount = 8,
    unackedCount = 8,
  ) =>
    client.get<FeaturedUserAlerts>(
      `/users/${userId}/alerts/@featured?acked_count=${ackedCount}&unacked_count=${unackedCount}`,
      { token, cache: "no-store" },
    ),

  patch: (
    userId: string,
    token: string,
    patches: { itag: string; patch: AlertPatchAction }[],
  ) =>
    client.patch<void>(`/users/${userId}/alerts`, { patches }, { token }),

  deleteAll: (userId: string, token: string) =>
    client.delete<void>(`/users/${userId}/alerts`, { token }),
};
