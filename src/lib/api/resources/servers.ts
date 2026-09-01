import { client } from "../client";
import type {
  CaptchaSolution,
  DiscordServerMeta,
  IndexServer,
  ListIndexServer,
  PagedResult,
  RandomServers,
  SEO,
  Server,
  ServerEmojiPreview,
  ServerSettingsUpdate,
  UserVote,
} from "../types";

export const serversResource = {
  getIndex: () =>
    client.get<ListIndexServer>("/servers/@index", {
      cache: "no-store",
    }),

  /** Minimal metadata for generateMetadata() — avoids a full getServer() fetch. */
  getSeo: (id: string) =>
    client.get<SEO>(`/servers/${id}/seo`, { cache: "no-store" }),

  getAll: (page = 1, sort?: "trending") =>
    client.get<PagedResult<IndexServer[]>>(
      `/servers/@all?page=${page}${sort ? `&sort=${sort}` : ""}`,
      { cache: "no-store" },
    ),

  getRandom: () =>
    client.get<RandomServers>("/servers/@random", {
      cache: "no-store",
    }),

  /** Other servers sharing at least one tag, ranked by how many they share. */
  getSimilar: (id: string) =>
    client.get<IndexServer[]>(`/servers/${id}/similar`, {
      cache: "no-store",
    }),

  getEmojis: (page = 1) =>
    client.get<PagedResult<ServerEmojiPreview[]>>(
      `/servers/@emojis?page=${page}`,
      { cache: "no-store" },
    ),

  getServer: (id: string) =>
    client.get<Server>(`/servers/${id}?include=long`, {
      cache: "no-store",
    }),

  getVoteInfo: (serverId: string, userId: string, token: string) =>
    client.get<UserVote>(`/users/${userId}/servers/${serverId}/votes`, {
      token,
      cache: "no-store",
    }),

  vote: (
    serverId: string,
    userId: string,
    upvote: boolean,
    token: string,
    captchaSolution?: CaptchaSolution,
  ) =>
    client.put<void>(
      `/users/${userId}/servers/${serverId}/votes?upvote=${upvote}`,
      captchaSolution ?? {},
      { token },
    ),

  deleteServer: (serverId: string, token: string) =>
    client.delete<void>(`/servers/${serverId}`, { token }),

  // Note: the backend returns 204 No Content on success, not the created server.
  createServer: (
    payload: import("../types").CreateServerPayload,
    token: string,
  ) => client.put<void>("/servers", payload, { token }),

  /** Resolves an invite link to the real server's name/icon/member counts, ahead of submitting Add Server. */
  getServerMeta: (invite: string, token: string) =>
    client.get<DiscordServerMeta>(
      `/servers/meta?invite=${encodeURIComponent(invite)}`,
      { token, cache: "no-store" },
    ),

  updateServer: (
    serverId: string,
    payload: ServerSettingsUpdate,
    token: string,
  ) => client.patch<void>(`/servers/${serverId}/settings`, payload, { token }),
};
