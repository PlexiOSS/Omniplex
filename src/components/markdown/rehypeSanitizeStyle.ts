import type { Root } from "hast";
import { visit } from "unist-util-visit";
import { sanitizeStyleValue } from "./sanitizeStyle";

/**
 * Runs after rehype-sanitize (which only sanitizes attribute *names*, not
 * `style` attribute *values*) to filter every inline style down to a safe
 * property/value allowlist. See sanitizeStyleValue for the rationale.
 */
export function rehypeSanitizeStyle() {
  return (tree: Root) => {
    visit(tree, "element", (node) => {
      const style = node.properties?.style;
      if (typeof style !== "string") return;

      const safe = sanitizeStyleValue(style);
      if (safe) {
        node.properties.style = safe;
      } else {
        delete node.properties.style;
      }
    });
  };
}
