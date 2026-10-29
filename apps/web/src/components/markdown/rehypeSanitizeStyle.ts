import type { Root } from "hast";
import { visit } from "unist-util-visit";
import { sanitizeStyleValue } from "./sanitizeStyle";

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
