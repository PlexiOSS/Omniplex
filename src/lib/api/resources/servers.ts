import { client } from "../client";
import type {
  DiscordServerMeta,
  IndexServer,
  ListIndexServer,
  PagedResult,
  Server,
  ServerSettingsUpdate,
  UserVote,
} from "../types";

export const serversResource = {
  getIndex: () =>
    client.get<ListIndexServer>("/servers/@index", {
      next: { revalidate: 60 },
    }),

  getAll: (page = 1) =>
    client.get<PagedResult<IndexServer[]>>(`/servers/@all?page=${page}`, {
      next: { revalidate: 30 },
    }),

  getServer: (id: string) =>
    client.get<Server>(`/servers/${id}?include=long`, {
      next: { revalidate: 60 },
    }),

  getVoteInfo: (serverId: string, userId: string, token: string) =>
    client.get<UserVote>(`/users/${userId}/servers/${serverId}/votes`, {
      token,
      cache: "no-store",
    }),

  vote: (serverId: string, userId: string, upvote: boolean, token: string) =>
    client.put<void>(
      `/users/${userId}/servers/${serverId}/votes?upvote=${upvote}`,
      {},
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
