import { client } from "../client";
import type { AppListResponse, AppMeta, CreateAppPayload } from "../types";

export const appsResource = {
  getMeta: () => client.get<AppMeta>("/apps/meta", { cache: "no-store" }),
  list: (userId: string, token: string) =>
    client.get<AppListResponse>(`/users/${userId}/apps`, {
      token,
      cache: "no-store",
    }),
  create: (userId: string, payload: CreateAppPayload, token: string) =>
    client.post<void>(`/users/${userId}/apps`, payload, { token }),
};
