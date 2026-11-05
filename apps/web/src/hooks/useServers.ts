"use client";

// Copyright (C) 2026 NodeByte LTD

import { servers } from "@omniplex/core/api";
import type {
  ListIndexServer,
  PagedResult,
  Server,
  ServerEmojiPreview,
} from "@omniplex/core/api/types";
import useSWR from "swr";

export function useServerIndex() {
  return useSWR<ListIndexServer>("servers/index", () => servers.getIndex());
}

export function useServer(id: string) {
  return useSWR<Server>(`servers/${id}`, () => servers.getServer(id));
}

export function useServerEmojis(page = 1) {
  return useSWR<PagedResult<ServerEmojiPreview[]>>(
    `servers/emojis/${page}`,
    () => servers.getEmojis(page),
  );
}
