import ReactMarkdown from "react-markdown";
import rehypeExternalLinks from "rehype-external-links";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { rehypeSanitizeStyle } from "./rehypeSanitizeStyle";
import { markdownSanitizeSchema } from "./sanitizeSchema";

interface MarkdownProps {
  /** Markdown source, optionally containing inline HTML. May also be plain text. */
  content: string;
  className?: string;
}

/**
 * Renders API-sourced Markdown (GFM tables/strikethrough/task-lists,
 * single-newline soft breaks, and inline HTML) through a sanitizer so the
 * output can never carry scripts, event handlers, or other injected markup.
 * Pair with the `.prose` styles in globals.css for typography.
 */
export function Markdown({ content, className }: MarkdownProps) {
  return (
    <div className={["prose", className].filter(Boolean).join(" ")}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[
          rehypeRaw,
          [rehypeSanitize, markdownSanitizeSchema],
          rehypeSanitizeStyle,
          [
            rehypeExternalLinks,
            { target: "_blank", rel: ["noopener", "noreferrer"] },
          ],
        ]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
