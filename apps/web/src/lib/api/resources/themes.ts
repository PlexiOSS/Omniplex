import { client } from "../client";
import type { CreateThemePayload, PagedResult, Theme } from "../types";

/** Discord profile themes -- a name plus two hex colors and up to 3 fixed
 * categories. No edit endpoint: nothing about a theme is worth revising
 * short of deleting and resubmitting. */
export const themesResource = {
  /** Used for both the public /themes gallery and the dashboard's "mine"
   * list (with `owner` set) -- no-store either way, same choice
   * serverTemplatesResource.getAll makes, so a just-deleted theme doesn't
   * linger in a cached response. */
  getAll: (page = 1, owner?: string) =>
    client.get<PagedResult<Theme[]>>(
      `/themes/@all?page=${page}${owner ? `&owner=${owner}` : ""}`,
      { cache: "no-store" },
    ),

  getById: (id: string) =>
    client.get<Theme>(`/themes/${id}`, { next: { revalidate: 60 } }),

  create: (userId: string, payload: CreateThemePayload, token: string) =>
    client.put<{ id: string }>(`/users/${userId}/themes`, payload, {
      token,
    }),

  delete: (userId: string, id: string, token: string) =>
    client.delete<void>(`/users/${userId}/themes/${id}`, { token }),
};
