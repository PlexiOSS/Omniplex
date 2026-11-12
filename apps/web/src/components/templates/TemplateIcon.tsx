import { templateIconUrl } from "@omniplex/core/utils/assets";
import { LayoutTemplate } from "lucide-react";

interface TemplateIconProps {
  templateId: string;
  version: string | null;
  name: string;
  size?: number;
  className?: string;
}

export function TemplateIcon({
  templateId,
  version,
  name,
  size = 40,
  className = "",
}: TemplateIconProps) {
  const radius = size >= 64 ? "rounded-2xl" : "rounded-xl";

  if (version) {
    return (
      // biome-ignore lint/performance/noImgElement: already a sized webp from our CDN
      <img
        src={templateIconUrl(templateId, version)}
        alt={name}
        width={size}
        height={size}
        className={`shrink-0 object-cover ${radius} ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center bg-accent/10 text-accent ${radius} ${className}`}
      style={{ width: size, height: size }}
    >
      <LayoutTemplate size={Math.round(size * 0.45)} />
    </div>
  );
}
