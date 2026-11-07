import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { ApiError } from "./client";
import { paymentsResource as payments } from "./resources/payments";
import { usersResource as users } from "./resources/users";

type Call = { url: string; method: string; body: unknown; auth?: string };

const realFetch = globalThis.fetch;
let calls: Call[] = [];
let reply: () => Response;

beforeEach(() => {
  calls = [];
  reply = () => Response.json({ url: "https://checkout.test/session" });
  globalThis.fetch = mock(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = (init?.headers ?? {}) as Record<string, string>;
      calls.push({
        url: String(input),
        method: init?.method ?? "GET",
        body: init?.body ? JSON.parse(String(init.body)) : undefined,
        auth: headers.Authorization,
      });
      return reply();
    },
  ) as unknown as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = realFetch;
});

describe("premium checkout", () => {
  test("Stripe sends the plan, listing and credits", async () => {
    const res = await payments.createStripeCheckout(
      "7",
      "bronze",
      "server",
      "42",
      "tok",
      120,
    );

    expect(res.url).toBe("https://checkout.test/session");
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toEndWith("/users/7/stripe");
    expect(calls[0].method).toBe("POST");
    expect(calls[0].auth).toBe("User tok");
    expect(calls[0].body).toEqual({
      id: "premium",
      name: "bronze",
      for: "42",
      for_type: "server",
      credits: 120,
    });
  });

  test("Stripe adds the promo code and gift only when given", async () => {
    await payments.createStripeCheckout(
      "7",
      "gold",
      "bot",
      "42",
      "tok",
      0,
      "SAVE10",
      { message: "enjoy", anonymous: true },
    );

    expect(calls[0].body).toMatchObject({
      promo_code: "SAVE10",
      gift: true,
      gift_message: "enjoy",
      gift_anonymous: true,
    });

    await payments.createStripeCheckout("7", "gold", "bot", "42", "tok");

    const plain = calls[1].body as Record<string, unknown>;
    expect(plain.credits).toBe(0);
    expect(plain).not.toHaveProperty("promo_code");
    expect(plain).not.toHaveProperty("gift");
  });

  test("PayPal sends the gift with the order", async () => {
    await payments.createPaypalOrder("7", "silver", "bot", "42", "tok", 0, {
      message: "",
      anonymous: false,
    });

    expect(calls[0].method).toBe("POST");
    expect(calls[0].body).toMatchObject({
      id: "premium",
      name: "silver",
      for: "42",
      for_type: "bot",
      gift: true,
      gift_message: "",
      gift_anonymous: false,
    });
  });

  test("a rejected checkout throws the API's message", async () => {
    reply = () =>
      Response.json({ message: "bot is already premium" }, { status: 400 });

    const err = await payments
      .createStripeCheckout("7", "bronze", "bot", "42", "tok")
      .catch((e) => e);

    expect(err).toBeInstanceOf(ApiError);
    expect(err.message).toBe("bot is already premium");
    expect(err.status).toBe(400);
  });
});

describe("Auto-vote checkout", () => {
  test("defaults to the monthly plan", async () => {
    await users.startAutoVoteCheckout("7", "tok");

    expect(calls[0].url).toEndWith("/users/7/auto-vote/checkout");
    expect(calls[0].body).toEqual({ plan: "monthly" });
  });

  test("sends the yearly plan and promo code", async () => {
    await users.startAutoVoteCheckout("7", "tok", "YEAR", "yearly");

    expect(calls[0].body).toEqual({ plan: "yearly", promo_code: "YEAR" });
  });
});
