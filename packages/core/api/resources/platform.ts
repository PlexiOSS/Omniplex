import { client } from "../client";

/** Fields aren't snake_case here — this passes through eureka's
 * dovewing.ClearUserInfo struct as-is, which has no json tags. */
export interface ClearUserInfo {
  ClearedFrom: string[];
  IsBot: boolean;
}

export const platformResource = {
  /** Invalidates the cached Discord profile (username/avatar) for this id,
   * so the next read re-fetches from Discord instead of serving a stale
   * cached copy. Unauthenticated route — works for any id, not just the
   * caller's own. */
  clearDiscordUser: (id: string) =>
    client.delete<ClearUserInfo>(`/platform/user/${id}?platform=discord`),
};
