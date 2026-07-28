import { client } from "../client";
import type { ListStats, PartnerList } from "../types";

export const listResource = {
  getStats: () => client.get<ListStats>("/list/stats"),
  getPartners: () => client.get<PartnerList>("/list/partners"),
};
