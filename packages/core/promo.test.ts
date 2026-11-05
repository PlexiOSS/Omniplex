import { describe, expect, test } from "bun:test";
import { formatCents, promoSummary } from "./promo";

const base = {
  percent_off: null,
  amount_off_cents: null,
  product: "premium" as const,
  duration: "once" as const,
  duration_months: null,
};

describe("formatCents", () => {
  test("formats US cents", () => {
    expect(formatCents(0)).toBe("$0.00");
    expect(formatCents(199)).toBe("$1.99");
  });
});

describe("promoSummary", () => {
  test("premium ignores duration", () => {
    expect(
      promoSummary({ ...base, percent_off: 75, duration: "forever" }),
    ).toBe("75% off");
  });

  test("auto-vote durations", () => {
    const av = { ...base, product: "autovote" as const };
    expect(promoSummary({ ...av, percent_off: 100 })).toBe(
      "100% off your first month",
    );
    expect(
      promoSummary({
        ...av,
        amount_off_cents: 100,
        duration: "repeating",
        duration_months: 3,
      }),
    ).toBe("$1.00 off for 3 months");
    expect(
      promoSummary({
        ...av,
        percent_off: 10,
        duration: "repeating",
        duration_months: 1,
      }),
    ).toBe("10% off for 1 month");
    expect(promoSummary({ ...av, percent_off: 20, duration: "forever" })).toBe(
      "20% off every month",
    );
  });
});
