import { client } from "../client";
import type { FlatPackSticker, PackStickerDetail, PagedResult } from "../types";

/** Standalone pack-sticker endpoints -- emojis.ts' counterpart. */
export const stickersResource = {
  getAll: (page = 1) =>
    client.get<PagedResult<FlatPackSticker[]>>(`/stickers/@all?page=${page}`, {
      next: { revalidate: 30 },
    }),

  getById: (id: string) =>
    client.get<PackStickerDetail>(`/stickers/${id}`, {
      next: { revalidate: 60 },
    }),

  recordDownload: (id: string) =>
    client.post<{ downloads: number }>(`/stickers/${id}/download`, {}),
};
