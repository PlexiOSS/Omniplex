import { client } from "../client";
import type {
  Bot,
  BotChangelog,
  BotChangelogList,
  BotCommandInput,
  BotCommandList,
  BotSettingsUpdate,
  CaptchaSolution,
  CreateBotChangelogPayload,
  DiscordBotMeta,
  IndexBot,
  ListIndexBot,
  PagedResult,
  PatchBotTeamPayload,
  RandomBots,
  SEO,
  UserVote,
} from "../types";

export const botsResource = {
  getIndex: () =>
    client.get<ListIndexBot>("/bots/@index", {
      cache: "no-store",
    }),

  /** Minimal metadata for generateMetadata() — avoids a full getBot() fetch. */
  getSeo: (id: string) =>
    client.get<SEO>(`/bots/${id}/seo`, { cache: "no-store" }),

  getAll: (page = 1, sort?: "trending") =>
    client.get<PagedResult<IndexBot[]>>(
      `/bots/@all?page=${page}${sort ? `&sort=${sort}` : ""}`,
      { cache: "no-store" },
    ),

  getRandom: () =>
    client.get<RandomBots>("/bots/@random", {
      cache: "no-store",
    }),

  /** Other bots sharing at least one tag, ranked by how many they share. */
  getSimilar: (id: string) =>
    client.get<IndexBot[]>(`/bots/${id}/similar`, { cache: "no-store" }),

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

  getCommands: (botId: string) =>
    client.get<BotCommandList>(`/bots/${botId}/commands`, {
      cache: "no-store",
    }),

  /** Replaces the whole command list — same "PUT the full array" convention as extra_links. */
  updateCommands: (botId: string, commands: BotCommandInput[], token: string) =>
    client.put<void>(`/bots/${botId}/commands`, { commands }, { token }),

  getChangelogs: (botId: string) =>
    client.get<BotChangelogList>(`/bots/${botId}/changelogs`, {
      cache: "no-store",
    }),

  createChangelog: (
    botId: string,
    payload: CreateBotChangelogPayload,
    token: string,
  ) =>
    client.post<BotChangelog>(`/bots/${botId}/changelogs`, payload, {
      token,
    }),

  deleteChangelog: (botId: string, changelogId: string, token: string) =>
    client.delete<void>(`/bots/${botId}/changelogs/${changelogId}`, {
      token,
    }),
};
