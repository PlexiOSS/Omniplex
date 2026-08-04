import { client } from "../client";
import type { PermissionData } from "../types";

export const staffResource = {
  /** Every flat permission that can be attached to a staff role, grouped by category */
  getPermissionCatalog: () =>
    client.get<{ perms: PermissionData[] }>("/staff/meta/permissions", {
      next: { revalidate: 3600 },
    }),
};
