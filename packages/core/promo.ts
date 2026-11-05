import type { PromoCodePreview } from "@omniplex/api-types";

export function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function promoSummary(
  preview: Pick<
    PromoCodePreview,
    | "percent_off"
    | "amount_off_cents"
    | "product"
    | "duration"
    | "duration_months"
  >,
) {
  const off =
    preview.percent_off != null
      ? `${preview.percent_off}% off`
      : `${formatCents(preview.amount_off_cents ?? 0)} off`;
  if (preview.product !== "autovote") return off;
  if (preview.duration === "forever") return `${off} every month`;
  if (preview.duration === "repeating" && preview.duration_months) {
    return `${off} for ${preview.duration_months} ${preview.duration_months === 1 ? "month" : "months"}`;
  }
  return `${off} your first month`;
}
