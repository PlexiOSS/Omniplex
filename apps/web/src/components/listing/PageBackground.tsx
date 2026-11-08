import type { PageStyle } from "@omniplex/core/api/types";
import { gradientCss, pageImageUrl } from "@omniplex/core/utils/pageStyle";

const POSITIONS = {
  top: "center top",
  center: "center",
  bottom: "center bottom",
} as const;

export function PageBackground({
  target,
  id,
  style,
  imageOverride,
}: {
  target: "bot" | "server";
  id: string;
  style: PageStyle | null;
  imageOverride?: string | null;
}) {
  if (!style) return null;
  const image =
    imageOverride ??
    (style.image_version
      ? pageImageUrl(target, id, style.image_version)
      : null);
  const gradient = gradientCss(style.gradient);
  if (!image && !gradient) return null;

  const layers = [image ? `url("${image}")` : null, gradient]
    .filter(Boolean)
    .join(", ");

  return (
    <div
      aria-hidden
      className={[
        "pointer-events-none absolute inset-x-0 top-0 -z-10 overflow-hidden",
        style.fixed ? "bottom-0" : "h-[min(100vh,52rem)]",
      ].join(" ")}
    >
      <div
        className="absolute inset-0 bg-cover"
        style={{
          backgroundImage: layers,
          backgroundPosition: POSITIONS[style.image_position],
          backgroundAttachment: style.fixed ? "fixed" : "scroll",
          filter: style.blur ? `blur(${style.blur}px)` : undefined,
          transform: style.blur && !style.fixed ? "scale(1.06)" : undefined,
        }}
      />
      <div
        className="absolute inset-0 bg-white dark:bg-zinc-950"
        style={{ opacity: style.dim / 100 }}
      />
      {!style.fixed && (
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-b from-transparent to-white dark:to-zinc-950" />
      )}
    </div>
  );
}
