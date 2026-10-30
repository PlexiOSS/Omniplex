import { WebhookVerificationError } from "./errors.js";
import type { WebhookEvent, WebhookProtocol } from "./types.js";

export type HeaderSource =
  | Headers
  | Record<string, string | string[] | undefined>;

export interface WebhookRequest {
  body: string | Uint8Array | ArrayBuffer;
  headers: HeaderSource;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function header(headers: HeaderSource, name: string): string | undefined {
  if (typeof (headers as Headers).get === "function") {
    return (headers as Headers).get(name) ?? undefined;
  }
  const wanted = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === wanted) {
      return Array.isArray(value) ? value[0] : value;
    }
  }
  return undefined;
}

type Bytes = Uint8Array<ArrayBuffer>;

function toBytes(body: WebhookRequest["body"]): Bytes {
  if (typeof body === "string") return encoder.encode(body);
  if (body instanceof Uint8Array) return new Uint8Array(body);
  return new Uint8Array(body);
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}

function fromHex(hex: string): Bytes {
  if (hex.length % 2 !== 0 || !/^[0-9a-fA-F]*$/.test(hex)) {
    throw new WebhookVerificationError("The webhook body isn't valid hex.");
  }
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function subtle(): SubtleCrypto {
  const s = globalThis.crypto?.subtle;
  if (!s) {
    throw new Error(
      "Web Crypto isn't available in this runtime. @omniplex/sdk needs Node 20 or newer, Bun, Deno or a browser.",
    );
  }
  return s;
}

async function hmacHex(
  hash: "SHA-256" | "SHA-512",
  key: string,
  data: Bytes,
): Promise<string> {
  const k = await subtle().importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash },
    false,
    ["sign"],
  );
  return toHex(await subtle().sign("HMAC", k, data));
}

async function openSplashtail(
  body: Bytes,
  secret: string,
  nonce: string,
): Promise<Bytes> {
  const keyBytes = await subtle().digest(
    "SHA-256",
    encoder.encode(secret + nonce),
  );
  const key = await subtle().importKey("raw", keyBytes, "AES-GCM", false, [
    "decrypt",
  ]);
  const sealed = fromHex(decoder.decode(body).trim());
  if (sealed.length < 12 + 16) {
    throw new WebhookVerificationError("The webhook body is too short.");
  }
  try {
    const plain = await subtle().decrypt(
      { name: "AES-GCM", iv: sealed.slice(0, 12) },
      key,
      sealed.slice(12),
    );
    return new Uint8Array(plain);
  } catch {
    throw new WebhookVerificationError(
      "The webhook body couldn't be decrypted.",
    );
  }
}

export async function verifyWebhook(
  request: WebhookRequest,
  secret: string,
): Promise<WebhookEvent> {
  if (!secret) {
    throw new WebhookVerificationError("A webhook secret is required.");
  }

  const body = toBytes(request.body);
  const protocol = header(request.headers, "x-webhook-protocol") as
    | WebhookProtocol
    | undefined;
  let payload: Bytes;

  switch (protocol) {
    case "hmac-sha256": {
      const given = header(request.headers, "x-webhook-signature") ?? "";
      const expected = `sha256=${await hmacHex("SHA-256", secret, body)}`;
      if (!safeEqual(given.toLowerCase(), expected)) {
        throw new WebhookVerificationError(
          "The webhook signature doesn't match.",
        );
      }
      payload = body;
      break;
    }
    case "simple-auth": {
      const given = header(request.headers, "authorization") ?? "";
      if (!safeEqual(given, secret)) {
        throw new WebhookVerificationError("The webhook secret doesn't match.");
      }
      payload = body;
      break;
    }
    case "splashtail": {
      const given = header(request.headers, "x-webhook-signature") ?? "";
      const nonce = header(request.headers, "x-webhook-nonce") ?? "";
      if (!nonce) {
        throw new WebhookVerificationError("The webhook nonce is missing.");
      }
      const inner = await hmacHex("SHA-512", secret, body);
      const expected = await hmacHex("SHA-512", nonce, encoder.encode(inner));
      if (!safeEqual(given.toLowerCase(), expected)) {
        throw new WebhookVerificationError(
          "The webhook signature doesn't match.",
        );
      }
      payload = await openSplashtail(body, secret, nonce);
      break;
    }
    default:
      throw new WebhookVerificationError(
        protocol
          ? `Unsupported webhook protocol "${protocol}".`
          : "The X-Webhook-Protocol header is missing.",
      );
  }

  return JSON.parse(decoder.decode(payload)) as WebhookEvent;
}

export async function verifyWebhookRequest(
  request: Request,
  secret: string,
): Promise<WebhookEvent> {
  const body = new Uint8Array(await request.arrayBuffer());
  return verifyWebhook({ body, headers: request.headers }, secret);
}

export function createWebhookHandler(
  secret: string,
  onEvent: (event: WebhookEvent) => unknown | Promise<unknown>,
): (request: Request) => Promise<Response> {
  return async (request) => {
    if (request.method !== "POST") {
      return new Response(null, { status: 405, headers: { Allow: "POST" } });
    }
    let event: WebhookEvent;
    try {
      event = await verifyWebhookRequest(request, secret);
    } catch (err) {
      if (err instanceof WebhookVerificationError) {
        return new Response(null, { status: 401 });
      }
      throw err;
    }
    await onEvent(event);
    return new Response(null, { status: 204 });
  };
}
