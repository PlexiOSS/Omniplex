import { describe, expect, test } from "bun:test";
import { Omniplex, OmniplexError } from "../src/index.js";

interface Call {
  url: string;
  method: string;
  headers: Headers;
  body?: unknown;
}

function mockFetch(responses: Response[]) {
  const calls: Call[] = [];
  const fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({
      url: String(input),
      method: init?.method ?? "GET",
      headers: new Headers(init?.headers),
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    });
    const next = responses.shift();
    if (!next) throw new Error("no more mocked responses");
    return next;
  }) as typeof globalThis.fetch;
  return { fetch, calls };
}

const json = (
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });

describe("stats", () => {
  test("postBotStats sends the token and snake_case body", async () => {
    const { fetch, calls } = mockFetch([new Response(null, { status: 204 })]);
    const client = new Omniplex({ token: "tok", fetch });
    await client.postBotStats({
      servers: 213,
      shards: 1,
      shardList: [0],
      status: "online",
    });
    expect(calls).toHaveLength(1);
    const call = calls[0];
    expect(call?.url).toBe("https://spider.omniplex.gg/bots/stats");
    expect(call?.method).toBe("POST");
    expect(call?.headers.get("authorization")).toBe("tok");
    expect(call?.body).toEqual({
      servers: 213,
      shards: 1,
      shard_list: [0],
      status: "online",
    });
  });

  test("postServerStats posts member counts", async () => {
    const { fetch, calls } = mockFetch([new Response(null, { status: 204 })]);
    await new Omniplex({ token: "tok", fetch }).postServerStats({
      totalMembers: 120,
      onlineMembers: 40,
    });
    expect(calls[0]?.url).toBe("https://spider.omniplex.gg/servers/stats");
    expect(calls[0]?.body).toEqual({ total_members: 120, online_members: 40 });
  });

  test("posting stats without a token fails before any request", async () => {
    const { fetch, calls } = mockFetch([]);
    await expect(
      new Omniplex({ fetch }).postBotStats({ servers: 1 }),
    ).rejects.toBeInstanceOf(OmniplexError);
    expect(calls).toHaveLength(0);
  });
});

describe("votes", () => {
  test("hasVoted reads has_voted from the public vote endpoint", async () => {
    const { fetch, calls } = mockFetch([
      json(200, {
        has_voted: true,
        valid_votes: [],
        vote_info: null,
        wait: null,
      }),
    ]);
    const client = new Omniplex({ fetch, baseUrl: "https://api.example/" });
    expect(await client.hasVoted("111", "222")).toBe(true);
    expect(calls[0]?.url).toBe("https://api.example/users/222/bots/111/votes");
    expect(calls[0]?.headers.get("authorization")).toBeNull();
  });
});

describe("errors and retries", () => {
  test("API errors carry the status, message and context", async () => {
    const { fetch } = mockFetch([
      json(400, {
        message: "Status must be one of online, idle, dnd or offline",
        context: { status: "oneof" },
      }),
    ]);
    const err = await new Omniplex({ token: "t", fetch, maxRetries: 0 })
      .postBotStats({ servers: 1 })
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(OmniplexError);
    const apiErr = err as OmniplexError;
    expect(apiErr.status).toBe(400);
    expect(apiErr.message).toBe(
      "Status must be one of online, idle, dnd or offline",
    );
    expect(apiErr.context).toEqual({ status: "oneof" });
  });

  test("retries after a 429 using Retry-After", async () => {
    const { fetch, calls } = mockFetch([
      json(429, { message: "slow down" }, { "Retry-After": "0" }),
      new Response(null, { status: 204 }),
    ]);
    await new Omniplex({ token: "t", fetch }).postBotStats({ servers: 5 });
    expect(calls).toHaveLength(2);
  });

  test("retries GETs on server errors but not POSTs", async () => {
    const get = mockFetch([json(503, {}), json(200, { id: "1" })]);
    await new Omniplex({ fetch: get.fetch }).getUser("1");
    expect(get.calls).toHaveLength(2);

    const post = mockFetch([json(503, { message: "down" })]);
    await expect(
      new Omniplex({ token: "t", fetch: post.fetch }).postBotStats({
        servers: 1,
      }),
    ).rejects.toMatchObject({ status: 503 });
    expect(post.calls).toHaveLength(1);
  });
});

test("autoPostBotStats posts straight away and stops cleanly", async () => {
  const { fetch, calls } = mockFetch([new Response(null, { status: 204 })]);
  const client = new Omniplex({ token: "t", fetch });
  const posted: number[] = [];
  const stop = client.autoPostBotStats(() => ({ servers: 7 }), {
    onPost: (s) => posted.push(s.servers ?? 0),
  });
  await new Promise((r) => setTimeout(r, 20));
  stop();
  expect(calls).toHaveLength(1);
  expect(posted).toEqual([7]);
});
