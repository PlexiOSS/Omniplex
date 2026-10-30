import { client } from "../client";
import type { EntityBadgeList, PublicBadgeList } from "../types";

export const badgesResource = {
  list: () =>
    client.get<PublicBadgeList>("/badges", { next: { revalidate: 300 } }),

  getForEntity: (targetType: string, targetId: string) =>
    client.get<EntityBadgeList>(`/${targetType}/${targetId}/badges`, {
      cache: "no-store",
    }),
};
