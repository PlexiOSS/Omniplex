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
        narrow ? "max-w-3xl" : "max-w-7xl",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
