import { client } from "../client";
import type {
  BoosterStatus,
  PaypalMeta,
  PlanList,
  RedirectUser,
  StripeMeta,
  TargetType,
} from "../types";

export const paymentsResource = {
  getPlans: () =>
    client.get<PlanList>("/payments/premium/plans", { cache: "no-store" }),

  /** Throws if PayPal isn't configured server-side — callers should treat
   * that as "hide the PayPal option" rather than a hard error. */
  getPaypalMeta: () =>
    client.get<PaypalMeta>("/payments/paypal", { cache: "no-store" }),

  /** Unlike PayPal's endpoint, this never errors even when unconfigured —
   * it just returns an empty `stripe_public_key`. Callers should treat an
   * empty key as "hide the Stripe option", not just a rejected request. */
  getStripeMeta: () =>
    client.get<StripeMeta>("/payments/stripe", { cache: "no-store" }),

  getBoosterStatus: (userId: string) =>
    client.get<BoosterStatus>(`/users/${userId}/booster`, {
      cache: "no-store",
    }),

  /** Returns a hosted Stripe Checkout URL — redirect the browser to it. */
  createStripeCheckout: (
    userId: string,
    planId: string,
    forType: Extract<TargetType, "bot" | "server">,
    forId: string,
    token: string,
  ) =>
    client.post<RedirectUser>(
      `/users/${userId}/stripe`,
      { id: "premium", name: planId, for: forId, for_type: forType },
      { token },
    ),

  /** Returns a PayPal approval URL — redirect the browser to it. */
  createPaypalOrder: (
    userId: string,
    planId: string,
    forType: Extract<TargetType, "bot" | "server">,
    forId: string,
    token: string,
  ) =>
    client.post<RedirectUser>(
      `/users/${userId}/paypal`,
      { id: "premium", name: planId, for: forId, for_type: forType },
      { token },
    ),

  redeemBoosterOffer: (
    userId: string,
    planId: string,
    forType: Extract<TargetType, "bot" | "server">,
    forId: string,
    token: string,
  ) =>
    client.post<void>(
      `/users/${userId}/redeem-payment-offer?code=BOOSTPREMIUM`,
      { id: "premium", name: planId, for: forId, for_type: forType },
      { token },
    ),
};
