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
};
