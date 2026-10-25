import { client } from "../client";
import type {
  Bot,
  BotBrowseSort,
  BotChangelog,
  BotChangelogFeedEntry,
  BotChangelogFeedFilters,
  BotChangelogList,
  BotCommandInput,
  BotCommandList,
  BotCommandSearchFilters,
  BotCommandSearchResult,
  BotSettingsUpdate,
  BotWithCommands,
  BrowseFilters,
  CaptchaSolution,
  CreateBotChangelogPayload,
  DiscordBotMeta,
  IndexBot,
  ListIndexBot,
  PagedResult,
  PatchBotTeamPayload,
  RandomBots,
  RecentChangelogBot,
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

  getAll: (page = 1, filters: BrowseFilters<BotBrowseSort> = {}) => {
    const params = new URLSearchParams({ page: String(page) });
    if (filters.sort) params.set("sort", filters.sort);
    if (filters.tag) params.set("tag", filters.tag);
    if (filters.certified) params.set("certified", "true");
    return client.get<PagedResult<IndexBot[]>>(`/bots/@all?${params}`, {
      cache: "no-store",
    });
  },

  getRandom: () =>
    client.get<RandomBots>("/bots/@random", {
      cache: "no-store",
    }),

  getSimilar: (id: string) =>
    client.get<IndexBot[]>(`/bots/${id}/similar`, { cache: "no-store" }),

  getBot: (id: string, token?: string) =>
    client.get<Bot>(`/bots/${id}?include=long`, {
      token,
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

  getCommands: (botId: string, token?: string) =>
    client.get<BotCommandList>(`/bots/${botId}/commands`, {
      token,
      cache: "no-store",
    }),

  updateCommands: (botId: string, commands: BotCommandInput[], token: string) =>
    client.put<void>(`/bots/${botId}/commands`, { commands }, { token }),

  getChangelogs: (botId: string, token?: string) =>
    client.get<BotChangelogList>(`/bots/${botId}/changelogs`, {
      token,
      cache: "no-store",
    }),

  getChangelogFeed: (page = 1, filters: BotChangelogFeedFilters = {}) => {
    const params = new URLSearchParams({ page: String(page) });
    if (filters.q) params.set("q", filters.q);
    if (filters.tag) params.set("tag", filters.tag);
    if (filters.bot) params.set("bot", filters.bot);
    return client.get<PagedResult<BotChangelogFeedEntry[]>>(
      `/bots/@changelogs?${params}`,
      { cache: "no-store" },
    );
  },

  getRecentChangelogBots: () =>
    client.get<RecentChangelogBot[]>("/bots/@changelogs/recent", {
      cache: "no-store",
    }),

  searchCommands: (page = 1, filters: BotCommandSearchFilters = {}) => {
    const params = new URLSearchParams({ page: String(page) });
    if (filters.query) params.set("query", filters.query);
    if (filters.tag) params.set("tag", filters.tag);
    if (filters.bot) params.set("bot", filters.bot);
    return client.get<PagedResult<BotCommandSearchResult[]>>(
      `/bots/@commands?${params}`,
      { cache: "no-store" },
    );
  },

  getCommandBots: () =>
    client.get<BotWithCommands[]>("/bots/@commands/bots", {
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
