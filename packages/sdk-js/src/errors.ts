import type { ApiErrorBody } from "@omniplex/api-types";

export interface OmniplexErrorInit {
  context?: Record<string, string>;
  retryAfter?: number;
  cause?: unknown;
}

export class OmniplexError extends Error {
  readonly status: number;
  readonly context?: Record<string, string>;
  readonly retryAfter?: number;

  constructor(status: number, message: string, init: OmniplexErrorInit = {}) {
    super(message, { cause: init.cause });
    this.name = "OmniplexError";
    this.status = status;
    this.context = init.context;
    this.retryAfter = init.retryAfter;
  }

  static async fromResponse(res: Response): Promise<OmniplexError> {
    let message = `${res.status} ${res.statusText}`.trim();
    let context: Record<string, string> | undefined;
    try {
      const body = (await res.json()) as Partial<ApiErrorBody>;
      if (typeof body.message === "string" && body.message) {
        message = body.message;
      }
      context = body.context;
    } catch {}
    return new OmniplexError(res.status, message, {
      context,
      retryAfter: retryAfterSeconds(res),
    });
  }
}

export class WebhookVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WebhookVerificationError";
  }
}

export function retryAfterSeconds(res: Response): number | undefined {
  const raw = res.headers.get("retry-after");
  if (!raw) return undefined;
  const seconds = Number(raw);
  if (Number.isFinite(seconds)) return Math.max(0, seconds);
  const date = Date.parse(raw);
  if (Number.isNaN(date)) return undefined;
  return Math.max(0, (date - Date.now()) / 1000);
}
