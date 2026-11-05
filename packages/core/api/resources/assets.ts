import { client } from "../client";

export type VersionedAssetTarget = "bot" | "server" | "team";
export type VersionedAssetKind = "avatar" | "banner";

const TARGET_PATH: Record<VersionedAssetTarget, string> = {
  bot: "bots",
  server: "servers",
  team: "teams",
};

export const assetsResource = {
  putVersion: (
    targetType: VersionedAssetTarget,
    targetId: string,
    kind: VersionedAssetKind,
    version: string,
    token: string,
  ) =>
    client.put<void>(
      `/${TARGET_PATH[targetType]}/${encodeURIComponent(targetId)}/assets/${kind}`,
      { version },
      { token, cache: "no-store" },
    ),
};
