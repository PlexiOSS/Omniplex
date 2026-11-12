import { Omi } from "@omniplex/ui/Omi";
import type { SVGProps } from "react";

export type OmiAvatarBadge = "servers" | "staff";

export const OMI_TONES = {
  omi: {
    from: "#3730a3",
    mid: "#4f46e5",
    to: "#818cf8",
    ink: "#4f46e5",
    glow: "#c7d2fe",
    soft: "#e0e7ff",
  },
  servers: {
    from: "#065f46",
    mid: "#059669",
    to: "#34d399",
    ink: "#059669",
    glow: "#a7f3d0",
    soft: "#d1fae5",
  },
  staff: {
    from: "#9a3412",
    mid: "#ea580c",
    to: "#fdba74",
    ink: "#ea580c",
    glow: "#fed7aa",
    soft: "#ffedd5",
  },
} as const;

export function omiTone(badge?: OmiAvatarBadge) {
  return OMI_TONES[badge ?? "omi"];
}

interface OmiAvatarProps extends SVGProps<SVGSVGElement> {
  badge?: OmiAvatarBadge;
}

export function OmiBadge({ kind }: { kind: OmiAvatarBadge }) {
  return (
    <g>
      <circle cx="150" cy="152" r="27" fill="#ffffff" />
      <circle
        cx="150"
        cy="152"
        r="27"
        fill="none"
        stroke={omiTone(kind).ink}
        strokeWidth="3"
      />
      {kind === "servers" &&
        [138, 149, 160].map((y) => (
          <g key={y}>
            <rect
              x="135"
              y={y}
              width="30"
              height="9"
              rx="2.5"
              fill={omiTone(kind).ink}
            />
            <circle cx="140" cy={y + 4.5} r="1.8" fill="#4ade80" />
            <rect
              x="146"
              y={y + 3.5}
              width="14"
              height="2"
              rx="1"
              fill="#c7d2fe"
            />
          </g>
        ))}
      {kind === "staff" && (
        <g>
          <path
            d="M150 134 L166 140 V151 C166 162 159 169 150 172 C141 169 134 162 134 151 V140 Z"
            fill={omiTone(kind).ink}
          />
          <path
            d="M142.5 152 L148 157.5 L158 146.5"
            fill="none"
            stroke="#ffffff"
            strokeWidth="3.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}
    </g>
  );
}

export function OmiAvatar({ badge, ...props }: OmiAvatarProps) {
  const tone = omiTone(badge);
  const id = badge ?? "omi";

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
      {badge && <OmiBadge kind={badge} />}
    </svg>
  );
}
