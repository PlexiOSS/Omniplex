import { OmniplexLogo } from "@omniplex/ui/OmniplexLogo";
import type { SVGProps } from "react";

export type BotKind = "servers" | "staff";

export const BOT_TONES = {
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

export const BOT_NAMES: Record<BotKind, string> = {
  servers: "Omniplex Servers",
  staff: "Arcadia",
};

export function BotBadge({ kind }: { kind: BotKind }) {
  const ink = BOT_TONES[kind].ink;
  return (
    <g>
      <circle cx="150" cy="152" r="27" fill="#ffffff" />
      <circle
        cx="150"
        cy="152"
        r="27"
        fill="none"
        stroke={ink}
        strokeWidth="3"
      />
      {kind === "servers" &&
        [138, 149, 160].map((y) => (
          <g key={y}>
            <rect x="135" y={y} width="30" height="9" rx="2.5" fill={ink} />
            <circle cx="140" cy={y + 4.5} r="1.8" fill="#4ade80" />
            <rect
              x="146"
              y={y + 3.5}
              width="14"
              height="2"
              rx="1"
              fill="#d1fae5"
            />
          </g>
        ))}
      {kind === "staff" && (
        <g>
          <path
            d="M150 134 L166 140 V151 C166 162 159 169 150 172 C141 169 134 162 134 151 V140 Z"
            fill={ink}
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

function Backdrop({
  kind,
  width,
  height,
  glow,
}: {
  kind: BotKind;
  width: number;
  height: number;
  glow: { cx: number; cy: number; r: number };
}) {
  const tone = BOT_TONES[kind];
  const id = `bot-${kind}-${width}`;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={tone.from} />
          <stop offset="0.55" stopColor={tone.mid} />
          <stop offset="1" stopColor={tone.to} />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx={glow.cx} cy={glow.cy} r={glow.r}>
          <stop offset="0" stopColor={tone.glow} stopOpacity="0.45" />
          <stop offset="1" stopColor={tone.glow} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={width} height={height} fill={`url(#${id}-bg)`} />
      <rect width={width} height={height} fill={`url(#${id}-glow)`} />
    </g>
  );
}

interface BotAvatarProps extends SVGProps<SVGSVGElement> {
  kind: BotKind;
}

export function BotAvatar({ kind, ...props }: BotAvatarProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      role="img"
      aria-label={`${BOT_NAMES[kind]}, an official Omniplex bot`}
      color="#ffffff"
      {...props}
    >
      <Backdrop
        kind={kind}
        width={200}
        height={200}
        glow={{ cx: 0.45, cy: 0.42, r: 0.55 }}
      />
      <OmniplexLogo x={30} y={28} size={128} accent={BOT_TONES[kind].glow} />
      <BotBadge kind={kind} />
    </svg>
  );
}

interface BotBannerProps extends SVGProps<SVGSVGElement> {
  kind: BotKind;
  lines: string[];
  tagline: string;
}

export function BotBanner({ kind, lines, tagline, ...props }: BotBannerProps) {
  const tone = BOT_TONES[kind];
  const big = lines.length === 1;
  const size = big ? 58 : 42;
  const first = big ? 112 : 86;
  const step = size + 2;
  const after = first + step * (lines.length - 1);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 680 240"
      role="img"
      aria-label={`${lines.join(" ")}, ${tagline}`}
      color="#ffffff"
      {...props}
    >
      <Backdrop
        kind={kind}
        width={680}
        height={240}
        glow={{ cx: 0.8, cy: 0.55, r: 0.5 }}
      />
      <circle
        cx="560"
        cy="128"
        r="150"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.08"
        strokeWidth="26"
      />
      <g fontFamily="inherit" fill="#ffffff">
        {lines.map((line, n) => (
          <text
            key={line}
            x="258"
            y={first + n * step}
            fontSize={size}
            fontWeight="800"
          >
            {line}
          </text>
        ))}
        <text
          x="260"
          y={after + 34}
          fontSize="17"
          fontWeight="600"
          fill={tone.soft}
        >
          {tagline}
        </text>
        <text
          x="260"
          y={after + 60}
          fontSize="14"
          fontWeight="500"
          fill={tone.glow}
          fillOpacity="0.85"
        >
          omniplex.gg
        </text>
      </g>
      <g transform="translate(504 50)">
        <OmniplexLogo x={0} y={0} size={150} accent={tone.glow} />
        <g transform="translate(10 18) scale(0.76)">
          <BotBadge kind={kind} />
        </g>
      </g>
    </svg>
  );
}
