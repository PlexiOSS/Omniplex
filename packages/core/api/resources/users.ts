import { client } from "../client";
import type {
  AutoVoteNotify,
  AutoVoteStatus,
  AutoVoteTargetInput,
  BoosterPerks,
  MainServerStatus,
  RedirectUser,
  SEO,
  SitePrefs,
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
    options: { notify?: AutoVoteNotify } = {},
  ) =>
    client.put<void>(
      `/users/${userId}/auto-vote/targets`,
      { targets, ...options },
      { token },
    ),

  startAutoVoteCheckout: (
    userId: string,
    token: string,
    promoCode?: string,
    plan: "monthly" | "yearly" = "monthly",
  ) =>
    client.post<RedirectUser>(
      `/users/${userId}/auto-vote/checkout`,
      { plan, ...(promoCode ? { promo_code: promoCode } : {}) },
      {
        token,
      },
    ),

  getSitePrefs: (userId: string, token: string) =>
    client.get<SitePrefs>(`/users/${userId}/site-prefs`, {
      token,
      cache: "no-store",
    }),

  setSitePrefs: (
    userId: string,
    prefs: Record<string, unknown>,
    token: string,
  ) =>
    client.put<SitePrefs>(`/users/${userId}/site-prefs`, { prefs }, { token }),

  getBoosterPerks: (userId: string, token: string) =>
    client.get<BoosterPerks>(`/users/${userId}/booster-perks`, {
      token,
      cache: "no-store",
    }),

  setBoosterPerkTarget: (
    userId: string,
    target: { target_type: "bot" | "server"; target_id: string } | null,
    token: string,
  ) =>
    client.put<BoosterPerks>(
      `/users/${userId}/booster-perks`,
      target ?? { target_type: null, target_id: null },
      { token },
    ),

  setAutoVoteSlots: (userId: string, extraSlots: number, token: string) =>
    client.put<void>(
      `/users/${userId}/auto-vote/slots`,
      { extra_slots: extraSlots },
      { token },
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
