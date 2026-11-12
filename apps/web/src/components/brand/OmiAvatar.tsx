import { Omi } from "@omniplex/ui/Omi";
import type { SVGProps } from "react";
import { BOT_TONES } from "./BotAvatar";

type OmiAvatarProps = SVGProps<SVGSVGElement>;

export function OmiAvatar(props: OmiAvatarProps) {
  const tone = BOT_TONES.omi;
  const id = "omi";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      role="img"
      aria-label="Omi, the official Omniplex bot"
      {...props}
    >
      <defs>
        <linearGradient id={`omi-avatar-bg-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={tone.from} />
          <stop offset="0.55" stopColor={tone.mid} />
          <stop offset="1" stopColor={tone.to} />
        </linearGradient>
        <radialGradient
          id={`omi-avatar-glow-${id}`}
          cx="0.5"
          cy="0.45"
          r="0.55"
        >
          <stop offset="0" stopColor={tone.glow} stopOpacity="0.45" />
          <stop offset="1" stopColor={tone.glow} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="200" height="200" fill={`url(#omi-avatar-bg-${id})`} />
      <rect width="200" height="200" fill={`url(#omi-avatar-glow-${id})`} />
      <Omi
        mood="happy"
        crop="avatar"
        x={0}
        y={0}
        size={200}
        accent="#6366f1"
        aria-hidden="true"
      />
    </svg>
  );
}
