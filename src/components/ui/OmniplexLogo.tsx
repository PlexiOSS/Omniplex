interface OmniplexLogoProps {
  /** Icon size in px. Defaults to 28. */
  size?: number;
  className?: string;
}

/**
 * Omniplex logo mark as an inline SVG.
 * White fills use currentColor so they adapt to light/dark mode.
 * The brand accent fill tracks the viewer's chosen accent color
 * (--accent, set in Customize) instead of a fixed purple.
 */
export function OmniplexLogo({ size = 28, className = "" }: OmniplexLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 375 375"
      width={size}
      height={size}
      aria-label="Omniplex logo"
      role="img"
      className={className}
    >
      <defs>
        <clipPath id="opx-clip-outer">
          <path d="M 35 36.25 L 340.765625 36.25 L 340.765625 338.5 L 35 338.5 Z" clipRule="nonzero" />
        </clipPath>
        <clipPath id="opx-clip-accent">
          <path d="M 34.015625 98 L 158 98 L 158 297 L 34.015625 297 Z" clipRule="nonzero" />
        </clipPath>
      </defs>

      {/* Outer arc — currentColor so it's dark in light mode, white in dark mode */}
      <g clipPath="url(#opx-clip-outer)">
        <path
          fill="currentColor"
          fillRule="evenodd"
          d="M 225.589844 338.671875 C 252.628906 331.746094 276.699219 317.570312 295.824219 298.445312 C 323.847656 270.75 340.996094 232.503906 340.996094 190.300781 C 340.996094 148.09375 323.847656 109.515625 295.824219 81.496094 C 267.796875 53.796875 229.550781 36.320312 187.015625 36.320312 C 144.8125 36.320312 106.566406 53.796875 78.871094 81.496094 C 55.789062 104.902344 39.964844 135.566406 35.347656 169.855469 C 59.746094 121.71875 108.542969 96.328125 157.34375 98.308594 C 166.902344 95.011719 176.796875 93.363281 187.015625 93.363281 C 213.722656 93.363281 237.792969 104.246094 255.597656 122.046875 C 308.019531 174.472656 286.589844 298.113281 225.589844 338.671875"
        />
      </g>

      {/* Brand accent — follows the viewer's chosen accent color */}
      <g clipPath="url(#opx-clip-accent)">
        <path
          fill="var(--accent)"
          fillRule="evenodd"
          d="M 81.175781 158.316406 C 88.433594 151.0625 96.34375 145.128906 104.917969 140.511719 C 108.875 133.585938 113.820312 127.324219 119.425781 121.71875 C 129.976562 111.167969 142.835938 102.921875 157.34375 98.308594 C 108.542969 96.328125 59.746094 121.71875 35.347656 169.855469 C 34.359375 176.449219 34.027344 183.375 34.027344 190.300781 C 34.027344 231.511719 50.183594 268.769531 76.5625 296.46875 C 44.25 259.210938 40.292969 199.53125 81.175781 158.316406"
        />
      </g>

      {/* Inner shape — currentColor */}
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M 104.917969 140.511719 C 96.34375 145.128906 88.433594 151.0625 81.175781 158.316406 C 40.292969 199.53125 44.25 259.210938 76.5625 296.46875 C 77.222656 297.125 77.878906 297.785156 78.871094 298.777344 C 84.804688 304.710938 91.070312 309.984375 97.992188 314.929688 C 113.160156 324.492188 131.292969 330.101562 151.738281 330.101562 C 197.238281 330.101562 231.527344 302.402344 246.035156 266.460938 C 229.550781 278.992188 209.105469 286.246094 187.015625 286.246094 C 160.640625 286.246094 136.570312 275.695312 119.09375 258.21875 C 101.949219 241.078125 91.070312 217.007812 91.070312 190.300781 C 91.070312 172.167969 96.015625 155.019531 104.917969 140.511719"
      />
    </svg>
  );
}
