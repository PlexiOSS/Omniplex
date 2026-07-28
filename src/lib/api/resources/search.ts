import { client } from "../client";
import type { SearchQuery, SearchResponse } from "../types";

export const searchResource = {
  search: (query: SearchQuery) =>
    client.post<SearchResponse>("/list/search", query, {
      cache: "no-store",
    }),
};
