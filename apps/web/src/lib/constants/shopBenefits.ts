// Copyright (C) 2026 NodeByte LTD 

export const RECOGNIZED_BENEFIT_IDS = [
  "premium_days",
  "priority_boost",
  "featured_slot",
  "supporter_badge",
  "vote_blitz",
] as const;

export function isRecognizedBenefit(id: string): boolean {
  return (RECOGNIZED_BENEFIT_IDS as readonly string[]).includes(id);
}
