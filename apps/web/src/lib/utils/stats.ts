// Copyright (C) 2026 NodeByte LTD 

import type { ListStats } from "@/lib/api/types";

export function totalListedBots(stats: ListStats): number {
  return stats.total_approved_bots + stats.total_certified_bots;
}
