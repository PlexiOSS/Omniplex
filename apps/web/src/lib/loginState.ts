const KEY = "auth_states";
const TTL_MS = 15 * 60 * 1000;
const MAX_ENTRIES = 5;

interface Entry {
  s: string;
  t: number;
}

function read(): Entry[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    const now = Date.now();
    return parsed.filter(
      (e): e is Entry =>
        typeof e?.s === "string" &&
        typeof e?.t === "number" &&
        now - e.t < TTL_MS,
    );
  } catch {
    return [];
  }
}

function write(entries: Entry[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(entries.slice(-MAX_ENTRIES)));
  } catch {}
}

export function createLoginState(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const state = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(
    "",
  );
  write([...read(), { s: state, t: Date.now() }]);
  return state;
}

export function consumeLoginState(state: string | null): boolean {
  if (!state) return false;
  const entries = read();
  const found = entries.some((e) => e.s === state);
  write(entries.filter((e) => e.s !== state));
  return found;
}

export function discordLoginUrl(template: string): string {
  const url = template.replace("%REDIRECT_URL%", window.location.origin);
  return `${url}&state=${createLoginState()}`;
}
