"use client";

import useSWR from "swr";
import { servers } from "@/lib/api";
import type { IndexServer, ListIndexServer, PagedResult, Server } from "@/lib/api/types";

export function useServerIndex() {
  return useSWR<ListIndexServer>("servers/index", () => servers.getIndex());
}

export function useServerList(page = 1) {
  return useSWR<PagedResult<IndexServer[]>>(`servers/all/${page}`, () =>
    servers.getAll(page),
  );
}

export function useServer(id: string) {
  return useSWR<Server>(`servers/${id}`, () => servers.getServer(id));
}
