import { client } from "../client";
import type {
  Bot,
  BotSettingsUpdate,
  CaptchaSolution,
  DiscordBotMeta,
  IndexBot,
  ListIndexBot,
  PagedResult,
  PatchBotTeamPayload,
  RandomBots,
  UserVote,
} from "../types";

export const botsResource = {
  getIndex: () =>
    client.get<ListIndexBot>("/bots/@index", {
      cache: "no-store",
    }),

  getAll: (page = 1, sort?: "trending") =>
    client.get<PagedResult<IndexBot[]>>(
      `/bots/@all?page=${page}${sort ? `&sort=${sort}` : ""}`,
      { cache: "no-store" },
    ),

  getRandom: () =>
    client.get<RandomBots>("/bots/@random", {
      cache: "no-store",
    }),

  /** Pass include=long to get the long description */
  getBot: (id: string) =>
    client.get<Bot>(`/bots/${id}?include=long`, {
      cache: "no-store",
    }),

  getVoteInfo: (botId: string, userId: string, token: string) =>
    client.get<UserVote>(`/users/${userId}/bots/${botId}/votes`, {
      token,
      cache: "no-store",
    }),

  vote: (
    botId: string,
    userId: string,
    upvote: boolean,
    token: string,
    captchaSolution?: CaptchaSolution,
  ) =>
    client.put<void>(
      `/users/${userId}/bots/${botId}/votes?upvote=${upvote}`,
      captchaSolution ?? {},
      { token },
    ),

  deleteBot: (botId: string, token: string) =>
    client.delete<void>(`/bots/${botId}`, { token }),

  // Note: the backend returns 204 No Content on success, not the created bot.
  createBot: (payload: import("../types").CreateBotPayload, token: string) =>
    client.put<void>("/bots", payload, { token }),

  /** Resolves a client ID to the bot's real Discord name/avatar/status, ahead of submitting Add Bot. */
  getBotMeta: (clientId: string, token: string, fallbackBotId?: string) =>
    client.get<DiscordBotMeta>(
      `/bots/${clientId}/meta${fallbackBotId ? `?fallback_bot_id=${fallbackBotId}` : ""}`,
      { token, cache: "no-store" },
    ),

  updateBot: (botId: string, payload: BotSettingsUpdate, token: string) =>
    client.patch<void>(`/bots/${botId}/settings`, payload, { token }),

  /** Transfers a bot to a different team. Requires "Delete Bots" on the bot's
   * current team and "Add Bots" on the destination team — servers have no
   * equivalent endpoint. */
  transferTeam: (
    userId: string,
    botId: string,
    payload: PatchBotTeamPayload,
    token: string,
  ) =>
    client.patch<void>(`/users/${userId}/bots/${botId}/teams`, payload, {
      token,
    }),
};
