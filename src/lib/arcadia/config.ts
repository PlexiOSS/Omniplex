// Stripped of any trailing slash — postQuery() in client.ts always appends
// its own "/", so a value configured with one too (e.g. ".../" in the env
// var) produces a double slash. The panel API 301-redirects that to "/",
// and per the Fetch spec a POST following a 301 is replayed as a GET —
// which lands on the real endpoint as a GET and fails with a misleading
// "Method Not Allowed", making the panel API look down when it isn't.
export const ARCADIA_URL = (
  process.env.NEXT_PUBLIC_ARCADIA_URL ??
  "https://staging--panel-api.omniplex.gg"
).replace(/\/+$/, "");

export const ARCADIA_PANEL_SCOPE =
  process.env.NEXT_PUBLIC_ARCADIA_PANEL_SCOPE ?? "infinity-list";
