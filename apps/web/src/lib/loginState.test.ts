import { beforeEach, describe, expect, test } from "bun:test";
import { consumeLoginState, createLoginState } from "./loginState";

const store = new Map<string, string>();

Object.assign(globalThis, {
  localStorage: {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => store.set(k, v),
    removeItem: (k: string) => store.delete(k),
  },
});

describe("login state", () => {
  beforeEach(() => store.clear());

  test("accepts a state it created, once", () => {
    const state = createLoginState();
    expect(consumeLoginState(state)).toBe(true);
    expect(consumeLoginState(state)).toBe(false);
  });

  test("rejects missing and unknown states", () => {
    createLoginState();
    expect(consumeLoginState(null)).toBe(false);
    expect(consumeLoginState("attacker")).toBe(false);
  });

  test("keeps the last five so parallel tabs both work", () => {
    const states = Array.from({ length: 6 }, () => createLoginState());
    expect(consumeLoginState(states[0])).toBe(false);
    expect(consumeLoginState(states[1])).toBe(true);
    expect(consumeLoginState(states[5])).toBe(true);
  });

  test("expires after 15 minutes", () => {
    store.set(
      "auth_states",
      JSON.stringify([{ s: "old", t: Date.now() - 16 * 60 * 1000 }]),
    );
    expect(consumeLoginState("old")).toBe(false);
  });
});
