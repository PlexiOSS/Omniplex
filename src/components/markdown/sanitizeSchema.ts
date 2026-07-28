import type { Schema } from "hast-util-sanitize";
import { defaultSchema } from "rehype-sanitize";

/**
 * Extends the default (GitHub-style) sanitize schema so embedded raw HTML
 * and GFM output (tables, task-list checkboxes, syntax-highlight spans)
 * survive sanitization instead of being stripped.
 *
 * Deliberately does NOT allow `class`/`id` on arbitrary elements. Tailwind's
 * generated CSS is global, not scoped to this component, so an untrusted
 * class name from bot/server/blog content (e.g. a bio's own `fixed inset-0`
 * or `flex` layout markup) can collide with ours and break page layout —
 * the default schema's className allowance on `code` only (for
 * `language-*` syntax highlighting) is intentional and kept as-is.
 *
 * `style` IS allowed here (bios commonly ship as fully inline-styled HTML
 * with no reachable classes at all), but only at the attribute-name level —
 * `rehypeSanitizeStyle` runs after this schema and strips every declaration
 * down to a closed, validated property/value allowlist. Never rely on this
 * schema alone to make `style` safe.
 */
export const markdownSanitizeSchema: Schema = {
  ...defaultSchema,
  // Tags that must be removed along with their raw text content, not just
  // unwrapped. The default schema only strips `script` this way — anything
  // else disallowed by tagNames (style, svg, iframe, ...) has its *tag*
  // dropped but its text content left behind, which for a <style> block
  // means the raw CSS/data-URI source gets rendered as visible page text.
  strip: [
    ...(defaultSchema.strip ?? []),
    "style",
    "svg",
    "iframe",
    "object",
    "embed",
    "noscript",
    "template",
  ],
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    "video",
    "audio",
    "source",
    "mark",
    "kbd",
    "sup",
    "sub",
    "details",
    "summary",
  ],
  attributes: {
    ...defaultSchema.attributes,
    "*": [...(defaultSchema.attributes?.["*"] ?? []), "style"],
    a: [...(defaultSchema.attributes?.a ?? []), "target", "rel"],
    img: [
      ...(defaultSchema.attributes?.img ?? []),
      "loading",
      "referrerPolicy",
    ],
    input: [
      ...(defaultSchema.attributes?.input ?? []),
      "checked",
      "disabled",
      "type",
    ],
    video: ["src", "controls", "poster", "width", "height"],
    audio: ["src", "controls"],
    source: ["src", "type"],
  },
  protocols: {
    ...defaultSchema.protocols,
    src: [...(defaultSchema.protocols?.src ?? []), "https", "http"],
  },
};
