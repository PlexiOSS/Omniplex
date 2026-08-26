export const ARCADIA_URL = (
  process.env.NEXT_PUBLIC_ARCADIA_URL ??
  "https://prod--panel-api.omniplex.gg"
).replace(/\/+$/, "");

export const ARCADIA_PANEL_SCOPE =
  process.env.NEXT_PUBLIC_ARCADIA_PANEL_SCOPE ?? "infinity-list";
