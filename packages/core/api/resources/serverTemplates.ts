import { client } from "../client";
import type {
  CreateServerTemplatePayload,
  PagedResult,
  ServerTemplate,
  TemplateReactionSummary,
  UpdateServerTemplatePayload,
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

  update: (
    userId: string,
    id: string,
    payload: UpdateServerTemplatePayload,
    token: string,
  ) =>
    client.patch<void>(`/users/${userId}/server-templates/${id}`, payload, {
      token,
    }),

  delete: (userId: string, id: string, token: string) =>
    client.delete<void>(`/users/${userId}/server-templates/${id}`, {
      token,
    }),

  /** Refreshes the template from Discord. A 409 means it no longer exists there. */
  sync: (userId: string, id: string, token: string) =>
    client.post<void>(
      `/users/${userId}/server-templates/${id}/sync`,
      {},
      {
        token,
      },
    ),

  /** Points the template at an icon already uploaded through /api/uploads,
   * or removes it with null. */
  setIcon: (
    userId: string,
    id: string,
    version: string | null,
    token: string,
  ) =>
    client.put<void>(
      `/users/${userId}/server-templates/${id}/icon`,
      { version },
      { token },
    ),

  getReaction: (userId: string, id: string) =>
    client.get<TemplateReactionSummary>(
      `/users/${userId}/server-templates/${id}/reaction`,
      { cache: "no-store" },
    ),

  /** Sending the reaction that's already active clears it -- see the
   * backend's own doc comment on set_template_reaction. */
  setReaction: (userId: string, id: string, liked: boolean, token: string) =>
    client.put<TemplateReactionSummary>(
      `/users/${userId}/server-templates/${id}/reaction?liked=${liked}`,
      {},
      { token },
    ),
};
