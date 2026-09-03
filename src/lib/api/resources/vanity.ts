import { client } from "../client";

export interface VanityInfo {
  target_type: string;
  target_id: string;
  redirect: string | null;
  itag: string;
}

export const vanityResource = {
  resolve: (code: string) =>
    client.get<VanityInfo>(`/vanity/${code}`, { cache: "no-store" }),

  /** Requires the EntitySetVanity permission on the target. Server-side validation
   * (ASCII-only, no `@`, lowercased, space→dash, uniqueness, blacklist) — surface
   * whatever error message comes back rather than re-implementing those rules here. */
  update: (
    targetType: "bot" | "server" | "team" | "pack_emoji" | "pack_sticker",
    targetId: string,
    code: string,
    token: string,
  ) =>
    client.patch<void>(
      `/${targetType}/${targetId}/vanity`,
      { code },
      { token },
    ),
};
