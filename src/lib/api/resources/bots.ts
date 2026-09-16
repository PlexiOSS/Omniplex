import { client } from "../client";
import type {
  Bot,
  BotChangelog,
  BotChangelogFeedEntry,
  BotChangelogList,
  BotCommandInput,
  BotCommandList,
  BotCommandSearchResult,
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

  getSimilar: (id: string) =>
    client.get<IndexBot[]>(`/bots/${id}/similar`, { cache: "no-store" }),

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

  createBot: (payload: import("../types").CreateBotPayload, token: string) =>
    client.put<void>("/bots", payload, { token }),

  getBotMeta: (clientId: string, token: string, fallbackBotId?: string) =>
    client.get<DiscordBotMeta>(
      `/bots/${clientId}/meta${fallbackBotId ? `?fallback_bot_id=${fallbackBotId}` : ""}`,
      { token, cache: "no-store" },
    ),

  updateBot: (botId: string, payload: BotSettingsUpdate, token: string) =>
    client.patch<void>(`/bots/${botId}/settings`, payload, { token }),

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

  updateCommands: (botId: string, commands: BotCommandInput[], token: string) =>
    client.put<void>(`/bots/${botId}/commands`, { commands }, { token }),

  getChangelogs: (botId: string) =>
    client.get<BotChangelogList>(`/bots/${botId}/changelogs`, {
      cache: "no-store",
    }),

  getChangelogFeed: (page = 1) =>
    client.get<PagedResult<BotChangelogFeedEntry[]>>(
      `/bots/@changelogs?page=${page}`,
      { cache: "no-store" },
    ),

  searchCommands: (query: string, page = 1) =>
    client.get<PagedResult<BotCommandSearchResult[]>>(
      `/bots/@commands?query=${encodeURIComponent(query)}&page=${page}`,
      { cache: "no-store" },
    ),

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
