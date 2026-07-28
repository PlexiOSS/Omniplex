import { client } from "../client";
import type {
  Bot,
  BotSettingsUpdate,
  IndexBot,
  ListIndexBot,
  PagedResult,
  UserVote,
} from "../types";

export const botsResource = {
  getIndex: () =>
    client.get<ListIndexBot>("/bots/@index", {
      next: { revalidate: 60 },
    }),

  getAll: (page = 1) =>
    client.get<PagedResult<IndexBot[]>>(`/bots/@all?page=${page}`, {
      next: { revalidate: 30 },
    }),

  getRandom: () =>
    client.get<{ bots: IndexBot[] }>("/bots/@random", {
      cache: "no-store",
    }),

  /** Pass include=long to get the long description */
  getBot: (id: string) =>
    client.get<Bot>(`/bots/${id}?include=long`, {
      next: { revalidate: 60 },
    }),

  getVoteInfo: (botId: string, userId: string, token: string) =>
    client.get<UserVote>(`/users/${userId}/bots/${botId}/votes`, {
      token,
      cache: "no-store",
    }),

  vote: (botId: string, userId: string, upvote: boolean, token: string) =>
    client.put<void>(
      `/users/${userId}/bots/${botId}/votes?upvote=${upvote}`,
      {},
      { token },
    ),

  deleteBot: (botId: string, token: string) =>
    client.delete<void>(`/bots/${botId}`, { token }),

  // Note: the backend returns 204 No Content on success, not the created bot.
  createBot: (payload: import("../types").CreateBotPayload, token: string) =>
    client.put<void>("/bots", payload, { token }),

  updateBot: (botId: string, payload: BotSettingsUpdate, token: string) =>
    client.patch<void>(`/bots/${botId}/settings`, payload, { token }),
};
