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
 * dropped silently never passed through as-is.
 *
 * `font-family` is deliberately never allowed: the site lets users pick a
 * site-wide font (see globals.css `--font-body` / CustomizationPanel), and
 * letting embedded content override that per-block would undermine it.
 */
const COLOR_INNER =
  "#[0-9a-f]{3,8}|rgba?\\([\\d.,%\\s]+\\)|hsla?\\([\\d.,%\\s]+\\)|transparent|currentcolor|white|black";
const COLOR = new RegExp(`^(?:${COLOR_INNER})$`, "i");
const LENGTH_INNER = "-?\\d+(?:\\.\\d+)?(?:px|rem|em|%)?";
const LENGTH = new RegExp(`^${LENGTH_INNER}$`);
const LENGTH_LIST = new RegExp(
  `^(?:${LENGTH_INNER}|auto)(?:\\s+(?:${LENGTH_INNER}|auto)){0,3}$`,
);
const GRADIENT_TERM =
  "(?:linear-gradient|radial-gradient)\\([a-z0-9#.,%\\s()-]+\\)";
const BACKGROUND_LAYER = `(?:${GRADIENT_TERM}|${COLOR_INNER})`;
const BACKGROUND = new RegExp(
  `^${BACKGROUND_LAYER}(?:\\s*,\\s*${BACKGROUND_LAYER})*$`,
  "i",
);
const BORDER =
  /^\d+(\.\d+)?px\s+(solid|dashed|dotted)\s+(#[0-9a-f]{3,8}|rgba?\([\d.,%\s]+\)|hsla?\([\d.,%\s]+\))$/i;
const BOX_SHADOW_TERM = `(?:inset\\s+)?${LENGTH_INNER}\\s+${LENGTH_INNER}(?:\\s+${LENGTH_INNER})?(?:\\s+${LENGTH_INNER})?\\s+(?:${COLOR_INNER})`;
const BOX_SHADOW = new RegExp(
  `^${BOX_SHADOW_TERM}(?:\\s*,\\s*${BOX_SHADOW_TERM})*$`,
  "i",
);

const TEXT_SHADOW_TERM = `${LENGTH_INNER}\\s+${LENGTH_INNER}(?:\\s+${LENGTH_INNER})?\\s+(?:${COLOR_INNER})`;
const TEXT_SHADOW = new RegExp(
  `^${TEXT_SHADOW_TERM}(?:\\s*,\\s*${TEXT_SHADOW_TERM})*$`,
  "i",
);

const BLUR_FILTER = /^blur\(\d+(?:\.\d+)?(?:px)?\)$/i;
const GRID_TEMPLATE = /^[a-z0-9%.,()\s-]+$/i;

type Validator = (value: string) => boolean;

const PROPERTY_VALIDATORS: Record<string, Validator> = {
  color: (v) => COLOR.test(v),
  background: (v) => BACKGROUND.test(v),
  "background-color": (v) => COLOR.test(v),
  "box-shadow": (v) => BOX_SHADOW.test(v),
  "text-shadow": (v) => TEXT_SHADOW.test(v),
  "backdrop-filter": (v) => BLUR_FILTER.test(v),
  "-webkit-backdrop-filter": (v) => BLUR_FILTER.test(v),
  "border-color": (v) => COLOR.test(v),
  border: (v) => BORDER.test(v),
  "border-radius": (v) => LENGTH_LIST.test(v),
  "border-width": (v) => LENGTH_LIST.test(v),
  "border-style": (v) => /^(solid|dashed|dotted|none)$/i.test(v),
  padding: (v) => LENGTH_LIST.test(v),
  "padding-top": (v) => LENGTH.test(v),
  "padding-right": (v) => LENGTH.test(v),
  "padding-bottom": (v) => LENGTH.test(v),
  "padding-left": (v) => LENGTH.test(v),
  margin: (v) => LENGTH_LIST.test(v),
  "margin-top": (v) => LENGTH.test(v) || v === "auto",
  "margin-right": (v) => LENGTH.test(v) || v === "auto",
  "margin-bottom": (v) => LENGTH.test(v) || v === "auto",
  "margin-left": (v) => LENGTH.test(v) || v === "auto",
  gap: (v) => LENGTH_LIST.test(v),
  "row-gap": (v) => LENGTH.test(v),
  "column-gap": (v) => LENGTH.test(v),
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
  display: (v) =>
    /^(block|inline-block|inline|flex|inline-flex|grid|inline-grid)$/i.test(v),
  "grid-template-columns": (v) => GRID_TEMPLATE.test(v),
  "grid-template-rows": (v) => GRID_TEMPLATE.test(v),
  flex: (v) => /^(none|auto|initial|\d+(?:\.\d+)?)$/i.test(v),
  "flex-grow": (v) => /^\d+(?:\.\d+)?$/.test(v),
  "flex-shrink": (v) => /^\d+(?:\.\d+)?$/.test(v),
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

/**
 * Filters a raw inline `style` attribute value down to just the
 * declarations that pass the allowlist above, silently dropping the rest.
 *
 * @param style - Raw `style` attribute content, e.g. `"color:red;top:0"`.
 * @returns A semicolon-joined string of only the safe declarations (e.g.
 *   `"color:red"`), or `""` if none passed. Never throws — malformed
 *   declarations (no `:`, empty property/value) are skipped rather than
 *   erroring, since this runs on untrusted third-party HTML.
 *
 * Called from `rehypeSanitizeStyle.ts` (a rehype plugin run on every element
 * with a `style` attribute) for bot/server/pack `long` descriptions and blog
 * posts. `sanitizeSchema.ts` allows the `style` attribute back onto the
 * default rehype-sanitize schema specifically so this function has something
 * to filter — neither step is safe to use without the other.
 */
export function sanitizeStyleValue(style: string): string {
  const safeDeclarations: string[] = [];

  for (const raw of style.split(";")) {
    const idx = raw.indexOf(":");
    if (idx === -1) continue;

    const prop = raw.slice(0, idx).trim().toLowerCase();
    const value = raw.slice(idx + 1).trim();

    if (!prop || !value) continue;
    if (NEVER_ALLOWED.has(prop)) continue;
    if (/url\(|expression\(|javascript:|import|<|>/i.test(value)) continue;

    const validator = PROPERTY_VALIDATORS[prop];
    if (!validator || !validator(value)) continue;

    safeDeclarations.push(`${prop}:${value}`);
  }

  return safeDeclarations.join(";");
}
