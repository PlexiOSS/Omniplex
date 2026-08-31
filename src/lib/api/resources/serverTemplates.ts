import { client } from "../client";
import type {
  CreateServerTemplatePayload,
  PagedResult,
  ServerTemplate,
} from "../types";

export const serverTemplatesResource = {
  getAll: (page = 1, tags?: string[], owner?: string) =>
    client.get<PagedResult<ServerTemplate[]>>(
      `/server-templates/@all?page=${page}${tags && tags.length > 0 ? `&tags=${tags.map(encodeURIComponent).join(",")}` : ""}${owner ? `&owner=${owner}` : ""}`,
      { cache: "no-store" },
    ),

  getTemplate: (id: string) =>
    client.get<ServerTemplate>(`/server-templates/${id}`, {
      cache: "no-store",
    }),

  /** Discord validates the code server-side -- there's no separate
   * "preview" call, submitting is the validation. */
  create: (
    userId: string,
    payload: CreateServerTemplatePayload,
    token: string,
  ) =>
    client.put<{ id: string }>(`/users/${userId}/server-templates`, payload, {
      token,
    }),

  delete: (userId: string, id: string, token: string) =>
    client.delete<void>(`/users/${userId}/server-templates/${id}`, {
      token,
    }),
};
