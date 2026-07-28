import { client } from "../client";
import type { AuthSession, User } from "../types";

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
  ): Promise<AuthSession> => {
    const res = await client.post<CreateSessionResponse>(
      "/auth/login/discord-oauth2",
      {
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        protocol: "persepolis-infernoplex",
        scope: "normal",
      },
      { cache: "no-store" },
    );

    const user = await client.get<User>(`/users/${res.target_id}`, {
      token: res.token,
      cache: "no-store",
    });

    return {
      token: res.token,
      user_id: res.target_id,
      session_id: res.session_id,
      expires_at: Date.now() + 30 * 24 * 60 * 60 * 1000,
      avatar: user.user?.avatar ?? "",
      username: user.user?.username ?? "",
      display_name: user.user?.display_name ?? "",
    };
  },
};
