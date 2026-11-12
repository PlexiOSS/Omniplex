import { Omi } from "@omniplex/ui/Omi";
import type { SVGProps } from "react";
import { type OmiAvatarBadge, OmiBadge, omiTone } from "./OmiAvatar";

const PAWS: [number, number, number, number][] = [
  [40, 34, -18, 1],
  [112, 70, 12, 0.8],
  [64, 128, 24, 0.9],
  [176, 30, -8, 0.7],
  [228, 104, 30, 0.85],
  [300, 40, -22, 0.75],
  [356, 200, 10, 0.8],
  [404, 26, 18, 0.7],
  [628, 26, -14, 0.8],
];

function Paw({ x, y, r, s }: { x: number; y: number; r: number; s: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <ellipse cx="0" cy="6" rx="9" ry="7.5" />
      <ellipse cx="-10" cy="-5" rx="3.6" ry="4.6" />
      <ellipse cx="-3.5" cy="-10" rx="3.6" ry="4.6" />
      <ellipse cx="3.5" cy="-10" rx="3.6" ry="4.6" />
      <ellipse cx="10" cy="-5" rx="3.6" ry="4.6" />
    </g>
  );
}

interface OmiBannerProps extends SVGProps<SVGSVGElement> {
  lines?: string[];
  tagline?: string;
  badge?: OmiAvatarBadge;
}

export function OmiBanner({
  lines = ["Omi"],
  tagline = "The official Omniplex bot",
  badge,
  ...props
}: OmiBannerProps) {
  const big = lines.length === 1;
  const size = big ? 58 : 42;
  const first = big ? 112 : 86;
  const step = size + 2;
  const after = first + step * (lines.length - 1);
  const tone = omiTone(badge);
  const id = badge ?? "omi";
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 680 240"
      role="img"
      aria-label={`${lines.join(" ")}, ${tagline}`}
      {...props}
    >
      <defs>
        <linearGradient id={`omi-banner-bg-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={tone.from} />
          <stop offset="0.55" stopColor={tone.mid} />
          <stop offset="1" stopColor={tone.to} />
        </linearGradient>
        <radialGradient id={`omi-banner-glow-${id}`} cx="0.8" cy="0.55" r="0.5">
          <stop offset="0" stopColor={tone.glow} stopOpacity="0.45" />
          <stop offset="1" stopColor={tone.glow} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="680" height="240" fill={`url(#omi-banner-bg-${id})`} />
      <rect width="680" height="240" fill={`url(#omi-banner-glow-${id})`} />
      <circle
        cx="560"
        cy="128"
        r="150"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.08"
        strokeWidth="26"
      />
      <g fill="#ffffff" fillOpacity="0.09">
        {PAWS.map(([x, y, r, s]) => (
          <Paw key={`${x}-${y}`} x={x} y={y} r={r} s={s} />
        ))}
      </g>
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
      <Omi
        mood="wave"
        x={474}
        y={44}
        size={196}
        accent="#6366f1"
        aria-hidden="true"
      />
      {badge && (
        <g transform="translate(474 44) scale(0.98) translate(-98 8)">
          <OmiBadge kind={badge} />
        </g>
      )}
    </svg>
  );
}
