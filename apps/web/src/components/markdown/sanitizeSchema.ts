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
 *
 * `iframe` is allowed with an unrestricted `src` (any http/https URL,
 * protocol-checked the same way `img`/`video`/`audio` already are) — a
 * deliberate product decision to trust bot-owner-submitted embeds, even
 * though this is a real clickjacking/tracking/arbitrary-content surface.
 * `<style>`/`<svg>`/`<object>`/`<embed>` remain stripped; those weren't part
 * of that decision.
 */
export const markdownSanitizeSchema: Schema = {
  ...defaultSchema,
  strip: [
    ...(defaultSchema.strip ?? []),
    "style",
    "svg",
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
    "iframe",
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
    iframe: [
      "src",
      "width",
      "height",
      "allow",
      "allowfullscreen",
      "frameborder",
      "title",
      "loading",
      "referrerPolicy",
    ],
  },
  protocols: {
    ...defaultSchema.protocols,
    src: [...(defaultSchema.protocols?.src ?? []), "https", "http"],
  },
};
