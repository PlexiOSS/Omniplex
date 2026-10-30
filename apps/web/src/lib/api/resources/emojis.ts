import { client } from "../client";
import type { FlatPackEmoji, PackEmojiDetail, PagedResult } from "../types";

/** Standalone pack-emoji endpoints -- an emoji addressed on its own, not
 * as part of its owning pack's response. See routes/emojis' own doc
 * comment on the backend. */
export const emojisResource = {
  getAll: (page = 1) =>
    client.get<PagedResult<FlatPackEmoji[]>>(`/emojis/@all?page=${page}`, {
      next: { revalidate: 30 },
    }),

  getById: (id: string) =>
    client.get<PackEmojiDetail>(`/emojis/${id}`, { next: { revalidate: 60 } }),

  /** Records a download and returns the new total. Unauthenticated --
   * see download_pack_emoji's own doc comment on the backend. */
  recordDownload: (id: string) =>
    client.post<{ downloads: number }>(`/emojis/${id}/download`, {}),
};
