import type { ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  className?: string;
  narrow?: boolean;
}

/**
 * Container component that wraps its children in a responsive container with optional narrow width.
 * 
 * @param {ReactNode} children - The content to be wrapped inside the container.
 * @param {string} [className] - Optional additional class names to apply to the container.
 * @param {boolean} [narrow=false] - If true, the container will have a narrower maximum width.
 * @returns {JSX.Element} The rendered container component.
 */

export function Container({
  children,
  className = "",
  narrow = false,
}: ContainerProps) {
  return (
    <div
      className={[
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        narrow ? "max-w-3xl" : "",
        className,
      ].join(" ")}
      // Non-narrow width follows the user's Layout preference (--container-max,
      // set via data-layout on <html>) instead of a fixed Tailwind class, so it
      // works from a plain CSS var in server components too.
      style={narrow ? undefined : { maxWidth: "var(--container-max, 80rem)" }}
    >
      {children}
    </div>
  );
}
