import { client } from "../client";
import type {
  AutoVoteStatus,
  AutoVoteTargetInput,
  MainServerStatus,
  RedirectUser,
  SEO,
  UpdateUserPayload,
  User,
  UserActivity,
  UserPerm,
} from "../types";

export const usersResource = {
  getAutoVote: (userId: string, token: string) =>
    client.get<AutoVoteStatus>(`/users/${userId}/auto-vote`, {
      token,
      cache: "no-store",
    }),

  updateAutoVoteTargets: (
    userId: string,
    targets: AutoVoteTargetInput[],
    token: string,
  ) =>
    client.put<void>(
      `/users/${userId}/auto-vote/targets`,
      { targets },
      { token },
    ),

  startAutoVoteCheckout: (userId: string, token: string, promoCode?: string) =>
    client.post<RedirectUser>(
      `/users/${userId}/auto-vote/checkout`,
      promoCode ? { promo_code: promoCode } : {},
      {
        token,
      },
    ),

  openAutoVotePortal: (userId: string, token: string) =>
    client.post<RedirectUser>(
      `/users/${userId}/auto-vote/portal`,
      {},
      {
        token,
      },
    ),

  getMainServerStatus: (userId: string, token: string) =>
    client.get<MainServerStatus>(`/users/${userId}/main-server`, {
      token,
      cache: "no-store",
    }),

  getActivity: (userId: string) =>
    client.get<UserActivity>(`/users/${userId}/activity`, {
      next: { revalidate: 300 },
    }),

  getUser: (userId: string, token?: string) =>
    client.get<User>(
      `/users/${userId}`,
      token ? { token, cache: "no-store" } : { next: { revalidate: 60 } },
    ),

  /** Minimal metadata for generateMetadata() — avoids a full getUser() fetch. */
  getSeo: (userId: string) =>
    client.get<SEO>(`/users/${userId}/seo`, { next: { revalidate: 60 } }),

  updateUser: (userId: string, payload: UpdateUserPayload, token: string) =>
    client.patch<User>(`/users/${userId}`, payload, { token }),

  getPerms: (userId: string, token: string) =>
    client.get<UserPerm>(`/users/${userId}/perms`, {
      token,
      cache: "no-store",
    }),
};
