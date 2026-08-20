import { client } from "../client";
import type { ListStats, PartnerList, StaffTemplateList } from "../types";

export const listResource = {
  // Neither of these set a cache option before, which meant Next's fetch
  // defaulted to force-cache — cached indefinitely until the next deploy,
  // not just "stale for a while" like the other listing endpoints were.
  getStats: () => client.get<ListStats>("/list/stats", { cache: "no-store" }),
  getPartners: () =>
    client.get<PartnerList>("/list/partners", { cache: "no-store" }),
  getStaffTemplates: () =>
    client.get<StaffTemplateList>("/list/staff-templates", {
      cache: "no-store",
    }),
};
