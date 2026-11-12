import Link from "next/link";
import type { ReactNode } from "react";

export function OmiLink({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href="/about/omi"
      title="Meet Omi"
      aria-label="Meet Omi"
      className={`inline-flex rounded-2xl transition-transform hover:-rotate-3 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${className}`}
    >
      {children}
    </Link>
  );
}
