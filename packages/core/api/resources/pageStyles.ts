import { client } from "../client";
import type { ManagedPageStyle, PageStyle, PageStyleUpdate } from "../types";

type Target = "bot" | "server";

export const pageStylesResource = {
  get: (target: Target, id: string) =>
    client.get<PageStyle | null>(`/${target}s/${id}/page-style`, {
      next: { revalidate: 60 },
    }),

  getManaged: (target: Target, id: string, token: string) =>
    client.get<ManagedPageStyle>(`/${target}s/${id}/page-style/manage`, {
      token,
      cache: "no-store",
    }),

  update: (target: Target, id: string, body: PageStyleUpdate, token: string) =>
    client.patch<void>(`/${target}s/${id}/page-style`, body, { token }),

  /** Needs the Card Theme from the shop. An empty colour resets it. */
  setCardColor: (target: Target, id: string, color: string, token: string) =>
    client.put<void>(`/${target}s/${id}/card-color`, { color }, { token }),
};
