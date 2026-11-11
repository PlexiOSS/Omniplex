import { client } from "../client";

/** Fields aren't snake_case here — this passes through eureka's
 * dovewing.ClearUserInfo struct as-is, which has no json tags. */
export interface ClearUserInfo {
  ClearedFrom: string[];
  IsBot: boolean;
}

export const platformResource = {
  /** Invalidates the signed-in user's cached Discord profile (username/avatar),
   * so the next read re-fetches from Discord instead of serving a stale
   * cached copy. Only works for the caller's own id. */
  clearDiscordUser: (id: string, token: string) =>
    client.delete<ClearUserInfo>(`/platform/user/${id}?platform=discord`, {
      token,
    }),
};
