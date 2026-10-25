import type { Element, Root, Text } from "hast";
import { visit } from "unist-util-visit";

const HEADINGS = new Set(["h2", "h3", "h4"]);

function textOf(node: Element): string {
  let out = "";
  visit(node, "text", (child: Text) => {
    out += child.value;
  });
  return out;
}

export function headingSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "-");
}

export function rehypeHeadingIds() {
  return (tree: Root) => {
    const seen = new Map<string, number>();
    visit(tree, "element", (node) => {
      if (!HEADINGS.has(node.tagName)) return;
      const base = headingSlug(textOf(node));
      if (!base) return;
      const count = seen.get(base) ?? 0;
      seen.set(base, count + 1);
      node.properties.id = count === 0 ? base : `${base}-${count}`;
    });
  };
}
