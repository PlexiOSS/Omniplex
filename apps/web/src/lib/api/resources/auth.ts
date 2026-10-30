import { COOKIE_TOKEN, HEADER_SESSIONS } from "@/lib/utils/auth";
import { client } from "../client";
import type { AuthSession, TestAuthResult, User } from "../types";

export interface OauthMeta {
  client_id: string;
  url: string;
}

interface CreateSessionResponse {
  target_id: string;
  token: string;
  session_id: string;
}

export const authResource = {
  getOAuthMeta: (): Promise<OauthMeta> =>
    client.get<OauthMeta>("/auth/login/discord-oauth2", { cache: "no-store" }),

  callback: async (
    code: string,
    clientId: string,
    redirectUri: string,
    scope: "normal" | "ban_exempt" = "normal",
  ): Promise<AuthSession> => {
    const res = await client.post<CreateSessionResponse>(
      "/auth/login/discord-oauth2",
      {
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        protocol: "persepolis-infernoplex",
        scope,
      },
      { cache: "no-store" },
    );

    const token = HEADER_SESSIONS ? res.token : COOKIE_TOKEN;

    const user = await client.get<User>(`/users/${res.target_id}`, {
      token,
      cache: "no-store",
    });

    return {
      token,
      user_id: res.target_id,
      session_id: res.session_id,
      expires_at: Date.now() + 30 * 24 * 60 * 60 * 1000,
      avatar: user.user?.avatar ?? "",
      username: user.user?.username ?? "",
      display_name: user.user?.display_name ?? "",
    };
  },

  logout: (token: string) =>
    client.post<void>("/auth/logout", {}, { token, cache: "no-store" }),

  /** Checks whether a token is currently valid for a given target, without spending it on a real request. */
  testAuth: (authType: string, targetId: string, token: string) =>
    client.post<TestAuthResult>(
      "/auth/test",
      { auth_type: authType, target_id: targetId, token },
      { cache: "no-store" },
    ),
};
