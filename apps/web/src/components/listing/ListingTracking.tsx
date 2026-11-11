"use client";

import { bots, servers } from "@omniplex/core/api";
import { getSession } from "@omniplex/core/utils/auth";
import type { ComponentProps } from "react";
import { useEffect } from "react";

type Target = "bot" | "server";

function api(target: Target) {
  return target === "bot" ? bots : servers;
}

export function trackInviteClick(target: Target, id: string) {
  api(target)
    .recordInviteClick(id, getSession()?.token)
    .catch(() => {});
}

export function ListingViewTracker({
  target,
  id,
}: {
  target: Target;
  id: string;
}) {
  useEffect(() => {
    api(target)
      .recordView(id, getSession()?.token)
      .catch(() => {});
  }, [target, id]);

  return null;
}

export function TrackedInviteLink({
  listingType,
  listingId,
  href,
  children,
  ...props
}: Omit<ComponentProps<"a">, "target" | "rel" | "onClick"> & {
  listingType: Target;
  listingId: string;
  href: string;
}) {
  return (
    <a
      {...props}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackInviteClick(listingType, listingId)}
    >
      {children}
    </a>
  );
}
