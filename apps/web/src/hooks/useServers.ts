"use client";

// Copyright (C) 2026 NodeByte LTD

import useSWR from "swr";
import { servers } from "@/lib/api";
import type {
  ListIndexServer,
  PagedResult,
  Server,
  ServerEmojiPreview,
} from "@/lib/api/types";

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
