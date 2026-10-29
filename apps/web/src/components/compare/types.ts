import type { ReactNode } from "react";

export interface CompareStat {
  icon: ReactNode;
  label: string;
  value: string;
}

/** A bot or server normalized down to what the compare page needs to render
 * — built from the full `Bot`/`Server` (or `IndexBot`/`IndexServer`, for the
 * picker's search results) by each compare page's own mapping function. */
export interface CompareEntity {
  id: string;
  href: string;
  name: string;
  avatarSrc: string;
  short: string;
  tags: string[];
  stats: CompareStat[];
}
