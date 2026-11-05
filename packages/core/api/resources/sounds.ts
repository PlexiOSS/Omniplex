import { client } from "../client";
import type { FlatPackSound, PackSoundDetail, PagedResult } from "../types";

/** Standalone pack-sound endpoints -- stickers.ts' counterpart. */
export const soundsResource = {
  getAll: (page = 1) =>
    client.get<PagedResult<FlatPackSound[]>>(`/sounds/@all?page=${page}`, {
      next: { revalidate: 30 },
    }),

  getById: (id: string) =>
    client.get<PackSoundDetail>(`/sounds/${id}`, {
      next: { revalidate: 60 },
    }),

  recordDownload: (id: string) =>
    client.post<{ downloads: number }>(`/sounds/${id}/download`, {}),
};
