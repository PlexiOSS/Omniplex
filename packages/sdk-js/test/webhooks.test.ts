import { describe, expect, test } from "bun:test";
import {
  createWebhookHandler,
  verifyWebhook,
  verifyWebhookRequest,
  WebhookVerificationError,
} from "../src/index.js";
import fixtures from "./fixtures/webhooks.json";

const { secret, payload, hmac, splashtail } = fixtures;
const expected = JSON.parse(payload);

const hmacHeaders = {
  "X-Webhook-Protocol": "hmac-sha256",
  "X-Webhook-Signature": hmac.signature,
};

const splashtailHeaders = {
  "X-Webhook-Protocol": "splashtail",
  "X-Webhook-Signature": splashtail.signature,
  "X-Webhook-Nonce": splashtail.nonce,
};

describe("hmac-sha256", () => {
  test("accepts a request signed by Popplio", async () => {
    const event = await verifyWebhook(
      { body: hmac.body, headers: hmacHeaders },
      secret,
    );
    expect(event).toEqual(expected);
    if (event.type !== "NEW_VOTE") throw new Error("wrong type");
    expect(event.data.per_user).toBe(2);
  });

  test("matches headers case-insensitively", async () => {
    const lower = Object.fromEntries(
      Object.entries(hmacHeaders).map(([k, v]) => [k.toLowerCase(), v]),
    );
    await expect(
      verifyWebhook({ body: hmac.body, headers: lower }, secret),
    ).resolves.toEqual(expected);
  });

  test("rejects the wrong secret", async () => {
    await expect(
      verifyWebhook(
        { body: hmac.body, headers: hmacHeaders },
        "not-the-secret",
      ),
    ).rejects.toBeInstanceOf(WebhookVerificationError);
  });

  test("rejects a tampered body", async () => {
    const body = hmac.body.replace(`"votes":12`, `"votes":99`);
    await expect(
      verifyWebhook({ body, headers: hmacHeaders }, secret),
    ).rejects.toBeInstanceOf(WebhookVerificationError);
  });
});

describe("splashtail", () => {
  test("decrypts a request sealed by Popplio", async () => {
    const event = await verifyWebhook(
      { body: splashtail.body, headers: splashtailHeaders },
      secret,
    );
    expect(event).toEqual(expected);
  });

  test("rejects the wrong secret", async () => {
    await expect(
      verifyWebhook(
        { body: splashtail.body, headers: splashtailHeaders },
        "nope",
      ),
    ).rejects.toBeInstanceOf(WebhookVerificationError);
  });

  test("rejects a missing nonce", async () => {
    const { "X-Webhook-Nonce": _, ...headers } = splashtailHeaders;
    await expect(
      verifyWebhook({ body: splashtail.body, headers }, secret),
    ).rejects.toBeInstanceOf(WebhookVerificationError);
  });
});

describe("simple-auth", () => {
  const headers = {
    "X-Webhook-Protocol": "simple-auth",
    Authorization: secret,
  };

  test("accepts the matching secret", async () => {
    await expect(
      verifyWebhook({ body: payload, headers }, secret),
    ).resolves.toEqual(expected);
  });

  test("rejects a different secret", async () => {
    await expect(
      verifyWebhook(
        { body: payload, headers: { ...headers, Authorization: "x" } },
        secret,
      ),
    ).rejects.toBeInstanceOf(WebhookVerificationError);
  });
});

test("rejects a missing protocol header", async () => {
  await expect(
    verifyWebhook({ body: payload, headers: {} }, secret),
  ).rejects.toBeInstanceOf(WebhookVerificationError);
});

describe("fetch-style helpers", () => {
  const request = (
    headers: Record<string, string>,
    body: string,
    method = "POST",
  ) =>
    new Request("https://bot.example/webhook", {
      method,
      headers,
      body: method === "POST" ? body : undefined,
    });

  test("verifyWebhookRequest reads a Request", async () => {
    await expect(
      verifyWebhookRequest(request(hmacHeaders, hmac.body), secret),
    ).resolves.toEqual(expected);
  });

  test("createWebhookHandler answers 204, 401 and 405", async () => {
    const seen: string[] = [];
    const handler = createWebhookHandler(secret, (event) => {
      seen.push(event.type);
    });
    expect((await handler(request(hmacHeaders, hmac.body))).status).toBe(204);
    const forged = request(
      { ...hmacHeaders, "X-Webhook-Signature": "sha256=00" },
      hmac.body,
    );
    expect((await handler(forged)).status).toBe(401);
    expect((await handler(request(hmacHeaders, "", "GET"))).status).toBe(405);
    expect(seen).toEqual(["NEW_VOTE"]);
  });
});
