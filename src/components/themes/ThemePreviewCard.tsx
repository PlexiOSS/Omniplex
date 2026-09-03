import { Smile } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import type { PlatformUser } from "@/lib/api/types";
import { mirroredAvatarUrl } from "@/lib/utils/assets";

interface ThemePreviewCardProps {
  themeName: string;
  tags: string[];
  primaryColor: string;
  secondaryColor: string;
  owner: PlatformUser;
  /** Smaller sizing for grid tiles vs. the detail page -- same layout
   * either way, just scaled down. discord.place's own grid tiles show the
   * full card (avatar, name, bio, badges, message bar), not a stripped
   * teaser, and that's the whole visual point: the grid has to look like
   * a wall of real profile cards, not a wall of color swatches. */
  compact?: boolean;
}

/** A profile-card mockup matching discord.place's own theme-gallery
 * layout -- a colored border frame, avatar stacked above the name (not
 * beside it), pill-shaped badges and message box -- without copying its
 * exact content: built around the person who actually submitted it
 * rather than a hardcoded "Discord" placeholder, and without Discord's
 * own default bio text or branding.
 *
 * The theme's own name and categories render as badge pills inside the
 * card itself, not as a separate caption box glued underneath it -- this
 * is meant to be the whole tile, not a color swatch with a label. */
export function ThemePreviewCard({
  themeName,
  tags,
  primaryColor,
  secondaryColor,
  owner,
  compact = false,
}: ThemePreviewCardProps) {
  const name = owner.display_name || owner.username;
  const gradient = `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`;

  const badgeClass = compact
    ? "rounded-full bg-black/25 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm"
    : "rounded-full bg-black/25 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm";

  return (
    <div
      className={["rounded-2xl border-2", compact ? "p-3.5" : "p-5"].join(" ")}
      style={{ background: gradient, borderColor: primaryColor }}
    >
      <Avatar
        src={mirroredAvatarUrl("users", owner.id, owner.avatar)}
        alt={name}
        status={owner.status}
        size={compact ? 44 : 80}
        className={[
          "rounded-full shadow-md ring-white/80",
          compact ? "ring-2" : "ring-4",
        ].join(" ")}
      />

      <p
        className={[
          "mt-2.5 truncate font-bold text-white [text-shadow:0_1px_3px_rgb(0_0_0/0.35)]",
          compact ? "text-sm" : "text-lg",
        ].join(" ")}
      >
        {name}
      </p>
      <p
        className={[
          "truncate text-white/75 [text-shadow:0_1px_2px_rgb(0_0_0/0.3)]",
          compact ? "text-[11px]" : "text-sm",
        ].join(" ")}
      >
        @{owner.username}
      </p>

      <div
        className={
          compact ? "mt-2 flex flex-wrap gap-1" : "mt-3 flex flex-wrap gap-1.5"
        }
      >
        <span className={badgeClass}>{themeName}</span>
        {tags.map((tag) => (
          <span key={tag} className={badgeClass}>
            {tag}
          </span>
        ))}
      </div>

      <div
        className={[
          "flex items-center gap-2 rounded-full bg-black/25 text-white/70 backdrop-blur-sm",
          compact
            ? "mt-2.5 px-3 py-1.5 text-[11px]"
            : "mt-4 px-4 py-2.5 text-sm",
        ].join(" ")}
      >
        <span className="min-w-0 flex-1 truncate">
          Message @{owner.username}
        </span>
        <Smile size={compact ? 13 : 16} className="shrink-0" />
      </div>
    </div>
  );
}
