import { BsDiscord } from "react-icons/bs";

interface ThemePreviewCardProps {
  primaryColor: string;
  secondaryColor: string;
  /** Small tile for grid listings vs. the full mockup on a detail page. */
  compact?: boolean;
}

/** A purely decorative Discord-profile-card mockup, colored by the theme's
 * two hex colors. Nothing here is real user data or a live preview -- no
 * Discord OAuth scope for "your mutual friends/servers" exists on the
 * site, and discord.place's own gallery cards use the same static mockup
 * content on every card too, so this isn't a functional gap. */
export function ThemePreviewCard({
  primaryColor,
  secondaryColor,
  compact = false,
}: ThemePreviewCardProps) {
  return (
    <div
      className={["overflow-hidden rounded-2xl", compact ? "p-3" : "p-5"].join(
        " ",
      )}
      style={{
        background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
      }}
    >
      <div className="flex items-center gap-2.5">
        <div
          className={[
            "flex shrink-0 items-center justify-center rounded-full bg-white/90",
            compact ? "h-8 w-8" : "h-14 w-14",
          ].join(" ")}
        >
          <BsDiscord size={compact ? 14 : 26} className="text-[#5865F2]" />
        </div>
        {!compact && (
          <div className="min-w-0">
            <p className="truncate font-semibold text-white drop-shadow-sm">
              Discord
            </p>
            <p className="truncate text-xs text-white/80">discord</p>
          </div>
        )}
      </div>

      {!compact && (
        <>
          <p className="mt-3 text-xs leading-relaxed text-white/90 drop-shadow-sm">
            Be who you are and say what you feel, because those who mind
            don&apos;t matter, and those who matter don&apos;t mind.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-black/20 px-2 py-0.5 text-[10px] font-medium text-white">
              Member
            </span>
            <span className="rounded-full bg-black/20 px-2 py-0.5 text-[10px] font-medium text-white">
              Level 5
            </span>
          </div>
        </>
      )}
    </div>
  );
}
