import { client } from "../client";
import type {
  BrowseFilters,
  CaptchaSolution,
  DiscordServerMeta,
  IndexServer,
  ListIndexServer,
  PagedResult,
  RandomServers,
  SEO,
  Server,
  ServerBrowseSort,
  ServerEmojiPreview,
  ServerSettingsUpdate,
  UserVote,
} from "../types";

export const serversResource = {
  getIndex: () =>
    client.get<ListIndexServer>("/servers/@index", {
      cache: "no-store",
    }),

  getSeo: (id: string) =>
    client.get<SEO>(`/servers/${id}/seo`, { cache: "no-store" }),

  getAll: (page = 1, filters: BrowseFilters<ServerBrowseSort> = {}) => {
    const params = new URLSearchParams({ page: String(page) });
    if (filters.sort) params.set("sort", filters.sort);
    if (filters.tag) params.set("tag", filters.tag);
    if (filters.certified) params.set("certified", "true");
    return client.get<PagedResult<IndexServer[]>>(`/servers/@all?${params}`, {
      cache: "no-store",
    });
  },

  getRandom: () =>
    client.get<RandomServers>("/servers/@random", {
      cache: "no-store",
    }),

  getSimilar: (id: string) =>
    client.get<IndexServer[]>(`/servers/${id}/similar`, {
      cache: "no-store",
    }),

  getEmojis: (page = 1) =>
    client.get<PagedResult<ServerEmojiPreview[]>>(
      `/servers/@emojis?page=${page}`,
      { cache: "no-store" },
    ),

  getServer: (id: string, token?: string) =>
    client.get<Server>(`/servers/${id}?include=long`, {
      token,
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

  createServer: (
    payload: import("../types").CreateServerPayload,
    token: string,
  ) => client.put<void>("/servers", payload, { token }),

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
