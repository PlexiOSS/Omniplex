"use client";

import Link, { type LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import type { AnchorHTMLAttributes, ReactNode } from "react";

type SignInLinkProps = Omit<LinkProps, "href"> &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps | "href"> & {
    children?: ReactNode;
  };

/**
 * Same as next/link but remembers the current page in localStorage first, so
 * /auth/sauron can send the user back here after they finish signing in.
 * Use this instead of a plain <Link href="/auth/login"> anywhere a sign-in
 * prompt can appear away from the dashboard/add flows.
 */
export function SignInLink({ onClick, ...props }: SignInLinkProps) {
  const pathname = usePathname();

  return (
    <Link
      {...props}
      href="/auth/login"
      onClick={(e) => {
        localStorage.setItem("auth_redirect", pathname);
        onClick?.(e);
      }}
    />
  );
}
