"use client";

// Copyright (C) 2026 NodeByte LTD

import useSWR from "swr";
import { bots } from "@/lib/api";
import type {
  Bot,
  BotChangelogFeedEntry,
  BotChangelogFeedFilters,
  BotCommandSearchFilters,
  BotCommandSearchResult,
  BotWithCommands,
  ListIndexBot,
  PagedResult,
  RecentChangelogBot,
} from "@/lib/api/types";

export function useBotIndex() {
  return useSWR<ListIndexBot>("bots/index", () => bots.getIndex());
}

export function useBot(id: string) {
  return useSWR<Bot>(`bots/${id}`, () => bots.getBot(id));
}

export function useBotChangelogFeed(
  page = 1,
  filters: BotChangelogFeedFilters = {},
) {
  return useSWR<PagedResult<BotChangelogFeedEntry[]>>(
    [
      "bots/changelogs/feed",
      page,
      filters.q ?? "",
      filters.tag ?? "",
      filters.bot ?? "",
    ],
    () => bots.getChangelogFeed(page, filters),
    { keepPreviousData: true },
  );
}

export function useRecentChangelogBots() {
  return useSWR<RecentChangelogBot[]>("bots/changelogs/recent", () =>
    bots.getRecentChangelogBots(),
  );
}

export function useBotVoteInfo(
  botId: string,
  userId: string | undefined,
  token: string | undefined,
) {
  return useSWR(userId && token ? `bots/${botId}/votes/${userId}` : null, () =>
    bots.getVoteInfo(botId, userId!, token!),
  );
}

export function useCommandSearch(
  page: number,
  filters: BotCommandSearchFilters,
  enabled: boolean,
) {
  return useSWR<PagedResult<BotCommandSearchResult[]>>(
    enabled
      ? [
          "bots/commands/search",
          page,
          filters.query ?? "",
          filters.tag ?? "",
          filters.bot ?? "",
        ]
      : null,
    () => bots.searchCommands(page, filters),
    { keepPreviousData: true },
  );
}

export function useCommandBots() {
  return useSWR<BotWithCommands[]>("bots/commands/bots", () =>
    bots.getCommandBots(),
  );
}
