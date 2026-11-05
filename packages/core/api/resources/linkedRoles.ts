import { client } from "../client";
import type { LinkedRolesMeta, LinkedRolesResult } from "../types";

export const linkedRolesResource = {
  getMeta: () =>
    client.get<LinkedRolesMeta>("/linked-roles", { cache: "no-store" }),

  connect: (code: string, redirectUri: string) =>
    client.post<LinkedRolesResult>("/linked-roles/connect", {
      code,
      redirect_uri: redirectUri,
    }),
};
