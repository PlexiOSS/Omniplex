import type { Bot, Server, User, UserVote } from "@omniplex/api-types";
import { OmniplexError, retryAfterSeconds } from "./errors.js";
import type { BotStats, ServerStats } from "./types.js";

export const DEFAULT_BASE_URL = "https://api.omniplex.gg";

const MAX_RETRY_WAIT_MS = 60_000;
const MIN_AUTOPOST_INTERVAL_MS = 60_000;

export interface OmniplexOptions {
  token?: string;
  baseUrl?: string;
  fetch?: typeof fetch;
  maxRetries?: number;
  userAgent?: string;
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
  signal?: AbortSignal;
}

export interface GetListingOptions {
  includeLong?: boolean;
}

export interface AutoPostOptions {
  intervalMs?: number;
  onPost?: (stats: BotStats) => void;
  onError?: (error: unknown) => void;
}

function trimTrailingSlashes(url: string): string {
  let end = url.length;
  while (end > 0 && url[end - 1] === "/") end--;
  return url.slice(0, end);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const backoff = (attempt: number) => Math.min(500 * 2 ** attempt, 8_000);
const isBrowser =
  typeof window !== "undefined" && typeof document !== "undefined";

export class Omniplex {
  readonly baseUrl: string;
  readonly #token?: string;
  readonly #fetch: typeof fetch;
  readonly #maxRetries: number;
  readonly #userAgent: string;

  constructor(options: OmniplexOptions = {}) {
    this.baseUrl = trimTrailingSlashes(options.baseUrl ?? DEFAULT_BASE_URL);
    this.#token = options.token;
    this.#fetch = options.fetch ?? globalThis.fetch.bind(globalThis);
    this.#maxRetries = Math.max(0, options.maxRetries ?? 2);
    this.#userAgent =
      options.userAgent ?? "omniplex-sdk-js (+https://omniplex.gg)";
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = "GET", body, auth = false, signal } = options;
    const headers = new Headers({ Accept: "application/json" });

    if (!isBrowser) headers.set("User-Agent", this.#userAgent);

    if (auth) {
      if (!this.#token) {
        throw new OmniplexError(
          0,
          "This request needs an API token. Create one under API sessions in your Omniplex dashboard and pass it as `token`.",
        );
      }
      headers.set("Authorization", this.#token);
    }

    if (body !== undefined) headers.set("Content-Type", "application/json");

    const url = `${this.baseUrl}${path}`;

    for (let attempt = 0; ; attempt++) {
      const canRetry = attempt < this.#maxRetries;
      let res: Response;

      try {
        res = await this.#fetch(url, {
          method,
          headers,
          body: body === undefined ? undefined : JSON.stringify(body),
          signal,
        });
      } catch (err) {
        if (method === "GET" && canRetry && !signal?.aborted) {
          await sleep(backoff(attempt));
          continue;
        }
        throw new OmniplexError(
          0,
          `Request to ${path} failed: ${String(err)}`,
          { cause: err },
        );
      }

      if (res.status === 429 && canRetry) {
        const waitMs =
          (retryAfterSeconds(res) ?? backoff(attempt) / 1000) * 1000;
        if (waitMs <= MAX_RETRY_WAIT_MS) {
          await res.body?.cancel();
          await sleep(waitMs);
          continue;
        }
      }

      if (res.status >= 500 && method === "GET" && canRetry) {
        await res.body?.cancel();
        await sleep(backoff(attempt));
        continue;
      }

      if (!res.ok) throw await OmniplexError.fromResponse(res);

      const text = await res.text();
      return (text ? JSON.parse(text) : undefined) as T;
    }
  }

  getBot(id: string, options: GetListingOptions = {}): Promise<Bot> {
    const query = options.includeLong ? "?include=long" : "";
    return this.request<Bot>(`/bots/${encodeURIComponent(id)}${query}`);
  }

  getServer(id: string, options: GetListingOptions = {}): Promise<Server> {
    const query = options.includeLong ? "?include=long" : "";
    return this.request<Server>(`/servers/${encodeURIComponent(id)}${query}`);
  }

  getUser(id: string): Promise<User> {
    return this.request<User>(`/users/${encodeURIComponent(id)}`);
  }

  getBotVote(botId: string, userId: string): Promise<UserVote> {
    return this.request<UserVote>(
      `/users/${encodeURIComponent(userId)}/bots/${encodeURIComponent(botId)}/votes`,
    );
  }

  getServerVote(serverId: string, userId: string): Promise<UserVote> {
    return this.request<UserVote>(
      `/users/${encodeURIComponent(userId)}/servers/${encodeURIComponent(serverId)}/votes`,
    );
  }

  async hasVoted(botId: string, userId: string): Promise<boolean> {
    return (await this.getBotVote(botId, userId)).has_voted;
  }

  async hasVotedForServer(serverId: string, userId: string): Promise<boolean> {
    return (await this.getServerVote(serverId, userId)).has_voted;
  }

  async postBotStats(stats: BotStats): Promise<void> {
    await this.request<void>("/bots/stats", {
      method: "POST",
      auth: true,
      body: {
        servers: stats.servers,
        shards: stats.shards,
        users: stats.users,
        shard_list: stats.shardList,
        status: stats.status,
      },
    });
  }

  async postServerStats(stats: ServerStats): Promise<void> {
    await this.request<void>("/servers/stats", {
      method: "POST",
      auth: true,
      body: {
        total_members: stats.totalMembers,
        online_members: stats.onlineMembers,
      },
    });
  }

  autoPostBotStats(
    getStats: () => BotStats | Promise<BotStats>,
    options: AutoPostOptions = {},
  ): () => void {
    const intervalMs = Math.max(
      MIN_AUTOPOST_INTERVAL_MS,
      options.intervalMs ?? 30 * 60_000,
    );
    let stopped = false;

    const post = async () => {
      if (stopped) return;
      try {
        const stats = await getStats();
        await this.postBotStats(stats);
        options.onPost?.(stats);
      } catch (err) {
        if (options.onError) options.onError(err);
        else console.error("[omniplex] Failed to post bot stats:", err);
      }
    };

    void post();
    const timer = setInterval(post, intervalMs);
    (timer as { unref?: () => void }).unref?.();

    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }
}
