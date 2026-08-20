/**
 * The exact benefit IDs Popplio's purchase flow actually recognizes
 * (`routes/shop/assets/benefits.go`'s `ApplyBenefit`). A shop_item_benefits
 * row with any other ID is valid and purchasable, but silently does nothing
 * when a purchase applies it — Name/Description are free text for display
 * only, and the ID is the only thing that wires a benefit to a real effect.
 */
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
