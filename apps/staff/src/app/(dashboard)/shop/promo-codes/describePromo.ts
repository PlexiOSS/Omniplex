export function describePromo(promo: {
  percent_off: number | null;
  amount_off_cents: number | null;
  duration: string;
  duration_months: number | null;
  products: string[];
}) {
  const off =
    promo.percent_off != null
      ? `${promo.percent_off}% off`
      : `$${((promo.amount_off_cents ?? 0) / 100).toFixed(2)} off`;
  if (!promo.products.includes("autovote")) return off;
  if (promo.duration === "forever") return `${off}, every Auto-vote month`;
  if (promo.duration === "repeating") {
    return `${off}, first ${promo.duration_months} Auto-vote ${promo.duration_months === 1 ? "month" : "months"}`;
  }
  return `${off}, first Auto-vote month`;
}
