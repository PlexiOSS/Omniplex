import { client } from "../client";
import type { PermissionData, PublicStaffMember } from "../types";

export const staffResource = {
  /** Every flat permission that can be attached to a staff role, grouped by category */
  getPermissionCatalog: () =>
    client.get<{ perms: PermissionData[] }>("/staff/meta/permissions", {
      next: { revalidate: 3600 },
    }),

  /** Public team roster — who's on staff and what position(s) they hold. No auth required. */
  listPublicTeam: () =>
    client.get<PublicStaffMember[]>("/staff/team", {
      next: { revalidate: 300 },
    }),
};
