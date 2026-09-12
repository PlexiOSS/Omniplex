import { NextResponse } from "next/server";
import { auth, teams } from "@/lib/api";
import { ApiError, client } from "@/lib/api/client";
import type { BotPack } from "@/lib/api/types";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import { hasPermString } from "@/lib/permissions";
import { putObject } from "@/lib/s3/objects";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = new Set([
  "image/webp",
  "image/png",
  "image/jpeg",
  "image/gif",
]);

const ALLOWED_AUDIO_TYPE = "audio/mpeg";
const AUDIO_EXTENSION = "mp3";

type Kind =
  | "partner-logo"
  | "team-avatar"
  | "team-banner"
  | "bot-banner"
  | "server-banner"
  | "pack-emoji"
  | "pack-sticker"
  | "pack-sound";

function isPackAssetKind(
  kind: Kind,
): kind is "pack-emoji" | "pack-sticker" | "pack-sound" {
  return (
    kind === "pack-emoji" || kind === "pack-sticker" || kind === "pack-sound"
  );
}

interface KindConfig {
  key: (targetId: string, assetId?: string) => string;
  perm: string;
  requiresStaff: boolean;
  popplioTargetType?: "team" | "bot" | "server" | "pack";
  maxBytes?: number;
}

const EMOJI_MAX_BYTES = 256 * 1024;

const SOUND_MAX_BYTES = 2 * 1024 * 1024;

const KIND_CONFIG: Record<Kind, KindConfig> = {
  "partner-logo": {
    key: (id) => `avatars/partners/${id}.webp`,
    perm: "manage_partners",
    requiresStaff: true,
  },
  "team-avatar": {
    key: (id) => `avatars/teams/${id}.webp`,
    perm: "edit_team",
    requiresStaff: false,
    popplioTargetType: "team",
  },
  "team-banner": {
    key: (id) => `banners/teams/${id}.webp`,
    perm: "edit_team",
    requiresStaff: false,
    popplioTargetType: "team",
  },
  "bot-banner": {
    key: (id) => `banners/bots/${id}.webp`,
    perm: "edit_bots",
    requiresStaff: false,
    popplioTargetType: "bot",
  },
  "server-banner": {
    key: (id) => `banners/servers/${id}.webp`,
    perm: "edit_servers",
    requiresStaff: false,
    popplioTargetType: "server",
  },
  "pack-emoji": {
    key: (packUrl, assetId) => `emojis/packs/${packUrl}/${assetId}`,
    perm: "edit_packs",
    requiresStaff: false,
    popplioTargetType: "pack",
    maxBytes: EMOJI_MAX_BYTES,
  },
  "pack-sticker": {
    key: (packUrl, assetId) => `stickers/packs/${packUrl}/${assetId}`,
    perm: "edit_packs",
    requiresStaff: false,
    popplioTargetType: "pack",
    maxBytes: EMOJI_MAX_BYTES,
  },
  "pack-sound": {
    key: (packUrl, assetId) => `sounds/packs/${packUrl}/${assetId}`,
    perm: "edit_packs",
    requiresStaff: false,
    popplioTargetType: "pack",
    maxBytes: SOUND_MAX_BYTES,
  },
};

function isKind(value: unknown): value is Kind {
  return typeof value === "string" && value in KIND_CONFIG;
}

export async function POST(req: Request) {
  const form = await req.formData();

  const kind = form.get("kind");
  const targetId = form.get("targetId");
  const file = form.get("file");

  if (!isKind(kind)) {
    return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  }
  if (typeof targetId !== "string" || !targetId) {
    return NextResponse.json({ error: "Missing targetId" }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (kind !== "pack-sound" && !ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Unsupported image type — use WebP, PNG, JPEG, or GIF." },
      { status: 400 },
    );
  }
  if (kind === "pack-sound" && file.type !== ALLOWED_AUDIO_TYPE) {
    return NextResponse.json(
      { error: "Unsupported audio type — use MP3." },
      { status: 400 },
    );
  }

  const config = KIND_CONFIG[kind];
  const maxBytes = config.maxBytes ?? MAX_BYTES;

  if (file.size > maxBytes) {
    return NextResponse.json(
      { error: `File too large — ${Math.floor(maxBytes / 1024)}KB max.` },
      { status: 400 },
    );
  }

  let assetId: string | undefined;

  if (kind === "pack-sound") {
    const rawAssetId = form.get("assetId");
    if (typeof rawAssetId !== "string" || !rawAssetId) {
      return NextResponse.json(
        { error: "Missing assetId for pack-sound upload" },
        { status: 400 },
      );
    }
    assetId = `${rawAssetId}.${AUDIO_EXTENSION}`;
  } else if (isPackAssetKind(kind)) {
    const rawAssetId = form.get("assetId");
    if (typeof rawAssetId !== "string" || !rawAssetId) {
      return NextResponse.json(
        { error: `Missing assetId for ${kind} upload` },
        { status: 400 },
      );
    }
    const animated = form.get("animated") === "true";
    if (animated !== (file.type === "image/gif")) {
      const label = kind === "pack-emoji" ? "emojis" : "stickers";
      return NextResponse.json(
        {
          error: animated
            ? `Animated ${label} must be uploaded as GIF.`
            : `Non-animated ${label} can't be uploaded as GIF.`,
        },
        { status: 400 },
      );
    }
    assetId = `${rawAssetId}.${animated ? "gif" : "webp"}`;
  }

  if (config.requiresStaff) {
    const loginToken = form.get("loginToken");
    if (typeof loginToken !== "string" || !loginToken) {
      return NextResponse.json(
        { error: "Missing staff session" },
        { status: 401 },
      );
    }
    try {
      const hello = await arcadia.hello(loginToken);
      if (!hasPermString(hello.staff_member.resolved_perms, config.perm)) {
        return NextResponse.json(
          { error: "You don't have permission to do this." },
          { status: 403 },
        );
      }
    } catch (err) {
      const status = err instanceof ArcadiaError ? 401 : 500;
      return NextResponse.json(
        { error: "Invalid or expired staff session." },
        { status },
      );
    }
  } else {
    const userId = form.get("userId");
    const token = form.get("token");
    if (
      typeof userId !== "string" ||
      typeof token !== "string" ||
      !userId ||
      !token
    ) {
      return NextResponse.json({ error: "Missing session" }, { status: 401 });
    }

    const testResult = await auth
      .testAuth("user", userId, token)
      .catch(() => null);
    if (!testResult?.authorized) {
      return NextResponse.json(
        { error: "Invalid or expired session." },
        { status: 401 },
      );
    }

    if (isPackAssetKind(kind)) {
      const existingPack = await client
        .get<BotPack>(`/packs/${targetId}`, { cache: "no-store" })
        .catch((err) => {
          if (err instanceof ApiError && err.status === 404) return null;
          throw err;
        });

      if (existingPack && existingPack.owner.id !== userId) {
        return NextResponse.json(
          { error: "You don't have permission to do this." },
          { status: 403 },
        );
      }
    } else {
      const entityPerms = await teams
        // biome-ignore lint/style/noNonNullAssertion: every non-staff, non-pack-emoji Kind sets this
        .getEntityPerms(userId, config.popplioTargetType!, targetId)
        .catch(() => ({ perms: [] }));
      if (!hasPermString(entityPerms.perms, config.perm)) {
        return NextResponse.json(
          { error: "You don't have permission to do this." },
          { status: 403 },
        );
      }
    }
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const wrote = await putObject(
    config.key(targetId, assetId),
    bytes,
    file.type,
  );

  if (!wrote) {
    return NextResponse.json(
      { error: "Failed to store the uploaded file. Please try again." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
