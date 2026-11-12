import type { SVGProps } from "react";

export type OmiMood =
  | "happy"
  | "joy"
  | "wave"
  | "sleepy"
  | "confused"
  | "party";

export const OMI_MOODS: OmiMood[] = [
  "happy",
  "joy",
  "wave",
  "sleepy",
  "confused",
  "party",
];

export const OMI_BRAND_ACCENT = "#6366f1";

interface OmiProps extends Omit<SVGProps<SVGSVGElement>, "fill"> {
  mood?: OmiMood;
  crop?: "full" | "head" | "avatar";
  size?: number;
  fur?: string;
  accent?: string;
  title?: string;
}

const FUR_LIGHT = "#3f3f46";
const SOCK = "#f4f4f5";
const SOCK_LINE = "#d4d4d8";
const EYE = "#fafafa";
const PUPIL = "#0b0b10";
const NOSE = "#f472b6";
const MOUTH = "#d4d4d8";

export function Omi({
  mood = "happy",
  crop = "full",
  size = 160,
  fur = "#27272a",
  accent = "var(--accent)",
  title,
  ...rest
}: OmiProps) {
  const head = crop === "head";
  const avatar = crop === "avatar";
  const showBody = !head;
  const showLegs = crop === "full";
  const showPaws = !head;
  const openEyes = mood === "happy" || mood === "wave";
  const joyEyes = mood === "joy" || mood === "party";
  const label = title ?? `Omi the Omniplex cat, ${mood}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={head ? "34 14 132 132" : avatar ? "0 2 200 200" : "0 0 200 200"}
      width={size}
      height={size}
      role="img"
      aria-label={label}
      overflow="visible"
      {...rest}
    >
      {showLegs && (
        <path
          d="M138 166 C 178 168, 194 130, 172 104"
          fill="none"
          stroke={fur}
          strokeWidth="16"
          strokeLinecap="round"
        />
      )}
      {showLegs && (
        <path
          d="M178 118 C 178 111, 176 107, 172 104"
          fill="none"
          stroke={accent}
          strokeWidth="16"
          strokeLinecap="round"
        />
      )}
      {showBody && (
        <g>
          <ellipse cx="100" cy="150" rx="50" ry="40" fill={fur} />
          <ellipse cx="100" cy="160" rx="28" ry="24" fill={FUR_LIGHT} />
        </g>
      )}
      {showPaws && (
        <g>
          <ellipse cx="80" cy="186" rx="15" ry="9" fill={SOCK} />
          <ellipse cx="120" cy="186" rx="15" ry="9" fill={SOCK} />
          <path
            d="M75 183 L75 189 M85 183 L85 189 M115 183 L115 189 M125 183 L125 189"
            stroke={SOCK_LINE}
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
          />
        </g>
      )}
      {showLegs && mood === "wave" && (
        <g>
          <path
            d="M64 140 Q 38 122 40 98"
            fill="none"
            stroke={fur}
            strokeWidth="18"
            strokeLinecap="round"
          />
          <ellipse cx="40" cy="94" rx="12" ry="13" fill={SOCK} />
          <path
            d="M35 86 L35 91 M45 86 L45 91"
            stroke={SOCK_LINE}
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
          />
        </g>
      )}
      <path d="M50 78 L54 28 Q56 20 63 25 L96 52 Z" fill={fur} />
      <path d="M150 78 L146 28 Q144 20 137 25 L104 52 Z" fill={fur} />
      <path d="M60 64 L62 37 L86 54 Z" fill={accent} />
      <path d="M140 64 L138 37 L114 54 Z" fill={accent} />
      <ellipse cx="100" cy="88" rx="58" ry="48" fill={fur} />
      {!head && (
        <g>
          <path
            d="M58 122 Q100 142 142 122 L140 132 Q100 152 60 132 Z"
            fill={accent}
          />
          <circle cx="100" cy="143" r="9" fill={EYE} />
          <circle
            cx="100"
            cy="143"
            r="5"
            fill="none"
            stroke={accent}
            strokeWidth="2.5"
          />
        </g>
      )}
      <ellipse cx="100" cy="106" rx="24" ry="16" fill={FUR_LIGHT} />
      <ellipse cx="65" cy="104" rx="9" ry="6" fill={accent} opacity="0.4" />
      <ellipse cx="135" cy="104" rx="9" ry="6" fill={accent} opacity="0.4" />
      <path
        d="M60 103 L36 99 M60 109 L38 113 M140 103 L164 99 M140 109 L162 113"
        stroke="#a1a1aa"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M94 99 Q100 95 106 99 Q103 104 100 105 Q97 104 94 99 Z"
        fill={NOSE}
      />

      {openEyes && (
        <g>
          <ellipse cx="78" cy="84" rx="11" ry="13" fill={EYE} />
          <ellipse cx="122" cy="84" rx="11" ry="13" fill={EYE} />
          <ellipse cx="79" cy="86" rx="6.5" ry="8.5" fill={accent} />
          <ellipse cx="121" cy="86" rx="6.5" ry="8.5" fill={accent} />
          <ellipse cx="79" cy="87" rx="3" ry="4.5" fill={PUPIL} />
          <ellipse cx="121" cy="87" rx="3" ry="4.5" fill={PUPIL} />
          <circle cx="82" cy="81" r="2.6" fill="#ffffff" />
          <circle cx="124" cy="81" r="2.6" fill="#ffffff" />
        </g>
      )}
      {joyEyes && (
        <g fill="none" stroke={EYE} strokeWidth="4.5" strokeLinecap="round">
          <path d="M68 88 Q78 74 88 88" />
          <path d="M112 88 Q122 74 132 88" />
        </g>
      )}
      {mood === "sleepy" && (
        <g fill="none" stroke={EYE} strokeWidth="4" strokeLinecap="round">
          <path d="M68 86 Q78 93 88 86" />
          <path d="M112 86 Q122 93 132 86" />
        </g>
      )}
      {mood === "confused" && (
        <g>
          <ellipse cx="78" cy="84" rx="12" ry="14" fill={EYE} />
          <ellipse cx="79" cy="86" rx="7" ry="9" fill={accent} />
          <ellipse cx="79" cy="87" rx="3.2" ry="4.8" fill={PUPIL} />
          <circle cx="82" cy="81" r="2.8" fill="#ffffff" />
          <path
            d="M112 86 L133 83"
            fill="none"
            stroke={EYE}
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>
      )}

      {openEyes && (
        <path
          d="M100 105 Q96 113 89 110 M100 105 Q104 113 111 110"
          fill="none"
          stroke={MOUTH}
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}
      {joyEyes && (
        <path
          d="M90 108 Q100 124 110 108 Z"
          fill={NOSE}
          stroke={MOUTH}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      )}
      {mood === "sleepy" && (
        <path
          d="M96 110 Q100 113 104 110"
          fill="none"
          stroke={MOUTH}
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}
      {mood === "confused" && (
        <path
          d="M90 112 Q95 107 100 112 Q105 117 110 112"
          fill="none"
          stroke={MOUTH}
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}

      {mood === "sleepy" && (
        <g fill={accent} fontWeight="800" fontFamily="inherit">
          <text x="146" y="44" fontSize="20">
            z
          </text>
          <text x="162" y="28" fontSize="15">
            z
          </text>
          <text x="175" y="16" fontSize="11">
            z
          </text>
        </g>
      )}
      {mood === "confused" && (
        <text
          x="156"
          y="46"
          fontSize="34"
          fontWeight="800"
          fill={accent}
          fontFamily="inherit"
        >
          ?
        </text>
      )}
      {mood === "party" && (
        <g>
          <rect
            x="28"
            y="22"
            width="8"
            height="8"
            rx="2"
            fill={NOSE}
            transform="rotate(20 32 26)"
          />
          <rect
            x="164"
            y="18"
            width="8"
            height="8"
            rx="2"
            fill="#fbbf24"
            transform="rotate(-15 168 22)"
          />
          <circle cx="182" cy="56" r="4.5" fill="#22d3ee" />
          <circle cx="18" cy="60" r="4" fill={accent} />
          <rect
            x="96"
            y="2"
            width="7"
            height="12"
            rx="2"
            fill={accent}
            transform="rotate(30 99 8)"
          />
          <circle cx="140" cy="6" r="3.5" fill={NOSE} />
          <circle cx="56" cy="8" r="3.5" fill="#22d3ee" />
        </g>
      )}
    </svg>
  );
}
