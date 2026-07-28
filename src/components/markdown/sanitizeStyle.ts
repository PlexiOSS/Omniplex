/**
 * Strict allowlist filter for inline `style` attribute values on embedded
 * bio/blog HTML. Bios (bot/server/pack `long` descriptions) commonly ship as
 * fully inline-styled HTML — colored pill badges, gradient card backgrounds,
 * custom spacing — none of which come through a `class` attribute we could
 * scope. `rehype-sanitize`'s default schema (rightly) drops `style` entirely
 * since arbitrary CSS is a real attack surface: `position:fixed` overlays,
 * `url(...)` tracking pixels/exfiltration, `content:` injection, stacking
 * above our own UI via `z-index`, etc.
 *
 * This filter allows `style` back in, but only after stripping every
 * declaration down to a closed set of safe properties with strictly
 * validated values (no `url(`, no keywords/functions outside the allowed
 * set). Unknown properties, or values that don't match their validator, are
 * dropped silently — never passed through as-is.
 *
 * `font-family` is deliberately never allowed: the site lets users pick a
 * site-wide font (see globals.css `--font-body` / CustomizationPanel), and
 * letting embedded content override that per-block would undermine it.
 */

const COLOR =
  /^(#[0-9a-f]{3,8}|rgba?\([\d.,%\s]+\)|hsla?\([\d.,%\s]+\)|transparent|currentcolor|white|black)$/i;
const LENGTH = /^-?\d+(\.\d+)?(px|rem|em|%)?$/;
const LENGTH_LIST =
  /^(-?\d+(\.\d+)?(px|rem|em|%)?)(\s+-?\d+(\.\d+)?(px|rem|em|%)?){0,3}$/;
const GRADIENT = /^(linear-gradient|radial-gradient)\([a-z0-9#.,%\s-]+\)$/i;
const BORDER =
  /^\d+(\.\d+)?px\s+(solid|dashed|dotted)\s+(#[0-9a-f]{3,8}|rgba?\([\d.,%\s]+\)|hsla?\([\d.,%\s]+\))$/i;

type Validator = (value: string) => boolean;

const PROPERTY_VALIDATORS: Record<string, Validator> = {
  color: (v) => COLOR.test(v),
  background: (v) => COLOR.test(v) || GRADIENT.test(v),
  "background-color": (v) => COLOR.test(v),
  "border-color": (v) => COLOR.test(v),
  border: (v) => BORDER.test(v),
  "border-radius": (v) => LENGTH_LIST.test(v),
  "border-width": (v) => LENGTH_LIST.test(v),
  "border-style": (v) => /^(solid|dashed|dotted|none)$/i.test(v),
  padding: (v) => LENGTH_LIST.test(v),
  margin: (v) => LENGTH_LIST.test(v),
  gap: (v) => LENGTH_LIST.test(v),
  "max-width": (v) => LENGTH.test(v) || v === "auto",
  "min-width": (v) => LENGTH.test(v) || v === "auto",
  width: (v) => LENGTH.test(v) || v === "auto",
  height: (v) => LENGTH.test(v) || v === "auto",
  "font-size": (v) => LENGTH.test(v),
  "font-weight": (v) => /^(normal|bold|[1-9]00)$/i.test(v),
  "line-height": (v) => /^\d+(\.\d+)?$/.test(v) || LENGTH.test(v),
  "letter-spacing": (v) => LENGTH.test(v),
  "text-align": (v) => /^(left|center|right|justify)$/i.test(v),
  "text-transform": (v) => /^(uppercase|lowercase|capitalize|none)$/i.test(v),
  "text-decoration": (v) => /^(none|underline|line-through)$/i.test(v),
  display: (v) => /^(block|inline-block|inline|flex|inline-flex)$/i.test(v),
  "flex-wrap": (v) => /^(wrap|nowrap)$/i.test(v),
  "flex-direction": (v) => /^(row|column)$/i.test(v),
  "justify-content": (v) =>
    /^(flex-start|flex-end|center|space-between|space-around)$/i.test(v),
  "align-items": (v) =>
    /^(flex-start|flex-end|center|stretch|baseline)$/i.test(v),
  overflow: (v) => /^(hidden|visible|auto)$/i.test(v),
  "white-space": (v) => /^(normal|nowrap|pre-wrap)$/i.test(v),
};

// Properties that can enable clickjacking/overlay/exfiltration attacks —
// never allowed regardless of value.
const NEVER_ALLOWED = new Set([
  "position",
  "z-index",
  "content",
  "behavior",
  "-moz-binding",
  "pointer-events",
  "background-image",
  "cursor",
  "font-family",
  "top",
  "left",
  "right",
  "bottom",
]);

export function sanitizeStyleValue(style: string): string {
  const safeDeclarations: string[] = [];

  for (const raw of style.split(";")) {
    const idx = raw.indexOf(":");
    if (idx === -1) continue;

    const prop = raw.slice(0, idx).trim().toLowerCase();
    const value = raw.slice(idx + 1).trim();

    if (!prop || !value) continue;
    if (NEVER_ALLOWED.has(prop)) continue;
    // Blanket block on dangerous substrings regardless of property, as
    // defense-in-depth in case a validator regex has a gap.
    if (/url\(|expression\(|javascript:|import|<|>/i.test(value)) continue;

    const validator = PROPERTY_VALIDATORS[prop];
    if (!validator || !validator(value)) continue;

    safeDeclarations.push(`${prop}:${value}`);
  }

  return safeDeclarations.join(";");
}
