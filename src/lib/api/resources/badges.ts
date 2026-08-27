import { client } from "../client";
import type { EntityBadgeList } from "../types";

export const badgesResource = {
  getForEntity: (targetType: string, targetId: string) =>
    client.get<EntityBadgeList>(`/${targetType}/${targetId}/badges`, {
      cache: "no-store",
    }),
};
