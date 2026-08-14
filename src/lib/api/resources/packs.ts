import { client } from "../client";
import type {
  BotPack,
  CreatePackPayload,
  PackSettingsUpdate,
  PackType,
  PagedResult,
} from "../types";

export const packsResource = {
  getAll: (page = 1, packType?: PackType) =>
    client.get<PagedResult<BotPack[]>>(
      `/packs/@all?page=${page}${packType ? `&pack_type=${packType}` : ""}`,
      { next: { revalidate: 30 } },
    ),

  getPack: (url: string) =>
    client.get<BotPack>(`/packs/${url}`, {
      next: { revalidate: 60 },
    }),

  createPack: (userId: string, payload: CreatePackPayload, token: string) =>
    client.put<void>(`/users/${userId}/packs`, payload, { token }),

  updatePack: (
    userId: string,
    url: string,
    payload: PackSettingsUpdate,
    token: string,
  ) => client.patch<void>(`/users/${userId}/packs/${url}`, payload, { token }),

  deletePack: (userId: string, url: string, token: string) =>
    client.delete<void>(`/users/${userId}/packs/${url}`, { token }),
};
