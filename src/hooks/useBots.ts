"use client";

// Copyright (C) 2026 NodeByte LTD

import useSWR from "swr";
import { bots } from "@/lib/api";
import type {
  Bot,
  BotChangelogFeedEntry,
  IndexBot,
  ListIndexBot,
  PagedResult,
} from "@/lib/api/types";

export function useBotIndex() {
  return useSWR<ListIndexBot>("bots/index", () => bots.getIndex());
}

export function useBotList(page = 1, sort?: "trending") {
  return useSWR<PagedResult<IndexBot[]>>(`bots/all/${page}/${sort ?? ""}`, () =>
    bots.getAll(page, sort),
  );
}

export function useBot(id: string) {
  return useSWR<Bot>(`bots/${id}`, () => bots.getBot(id));
}

export function useBotChangelogFeed(page = 1) {
  return useSWR<PagedResult<BotChangelogFeedEntry[]>>(
    `bots/changelogs/feed/${page}`,
    () => bots.getChangelogFeed(page),
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
