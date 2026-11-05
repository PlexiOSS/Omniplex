import { createHash } from "node:crypto";
import { assets, auth, teams } from "@omniplex/core/api";
import { ApiError, client } from "@omniplex/core/api/client";
import { BASE_URL } from "@omniplex/core/api/config";
import type {
  VersionedAssetKind,
  VersionedAssetTarget,
} from "@omniplex/core/api/resources/assets";
import type { BotPack } from "@omniplex/core/api/types";
import { matchesDeclaredType } from "@omniplex/core/cdn/safety";
import { hasPermString } from "@omniplex/core/permissions";
import { ASSET_VERSION_METADATA_KEY } from "@omniplex/core/s3/config";
import {
  headObject,
  putObject,
  S3UnavailableError,
} from "@omniplex/core/s3/objects";
import { COOKIE_TOKEN } from "@omniplex/core/utils/auth";
import { NextResponse } from "next/server";
import { getServerToken } from "@/lib/utils/serverSession";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const SAFE_ID = /^[A-Za-z0-9_-]{1,100}$/;
const ALLOWED_TYPES = new Set([
  "image/webp",
  "image/png",
  "image/jpeg",
  "image/gif",
]);

const ALLOWED_AUDIO_TYPE = "audio/mpeg";
const AUDIO_EXTENSION = "mp3";

type Kind =
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
  popplioTargetType: "team" | "bot" | "server" | "pack";
  maxBytes?: number;
  versioned?: { target: VersionedAssetTarget; kind: VersionedAssetKind };
}

const EMOJI_MAX_BYTES = 256 * 1024;
const SOUND_MAX_BYTES = 2 * 1024 * 1024;

const KIND_CONFIG: Record<Kind, KindConfig> = {
  "team-avatar": {
    key: (id) => `avatars/teams/${id}.webp`,
    perm: "edit_team",
    popplioTargetType: "team",
    versioned: { target: "team", kind: "avatar" },
  },
  "team-banner": {
    key: (id) => `banners/teams/${id}.webp`,
    perm: "edit_team",
    popplioTargetType: "team",
    versioned: { target: "team", kind: "banner" },
  },
  "bot-banner": {
    key: (id) => `banners/bots/${id}.webp`,
    perm: "edit_bots",
    popplioTargetType: "bot",
    versioned: { target: "bot", kind: "banner" },
  },
  "server-banner": {
    key: (id) => `banners/servers/${id}.webp`,
    perm: "edit_servers",
    popplioTargetType: "server",
    versioned: { target: "server", kind: "banner" },
  },
  "pack-emoji": {
    key: (packUrl, assetId) => `emojis/packs/${packUrl}/${assetId}`,
    perm: "edit_packs",
    popplioTargetType: "pack",
    maxBytes: EMOJI_MAX_BYTES,
  },
  "pack-sticker": {
    key: (packUrl, assetId) => `stickers/packs/${packUrl}/${assetId}`,
    perm: "edit_packs",
    popplioTargetType: "pack",
    maxBytes: EMOJI_MAX_BYTES,
  },
  "pack-sound": {
    key: (packUrl, assetId) => `sounds/packs/${packUrl}/${assetId}`,
    perm: "edit_packs",
    popplioTargetType: "pack",
    maxBytes: SOUND_MAX_BYTES,
  },
};

function isKind(value: unknown): value is Kind {
  return typeof value === "string" && value in KIND_CONFIG;
}

function fromSite(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return req.headers.get("sec-fetch-site") === "same-origin";
  try {
    return new URL(origin).host === new URL(BASE_URL).host;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid form data or upload body interrupted." },
      { status: 400 },
    );
  }

  const kind = form.get("kind");
  const targetId = form.get("targetId");
  const file = form.get("file");

  if (!isKind(kind)) {
    return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  }
  if (typeof targetId !== "string" || !targetId) {
    return NextResponse.json({ error: "Missing targetId" }, { status: 400 });
  }
  if (!SAFE_ID.test(targetId)) {
    return NextResponse.json({ error: "Invalid targetId" }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (kind !== "pack-sound" && !ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Unsupported image type. Use WebP, PNG, JPEG, or GIF." },
      { status: 400 },
    );
  }
  if (kind === "pack-sound" && file.type !== ALLOWED_AUDIO_TYPE) {
    return NextResponse.json(
      { error: "Unsupported audio type. Use MP3." },
      { status: 400 },
    );
  }

  const config = KIND_CONFIG[kind];
  const maxBytes = config.maxBytes ?? MAX_BYTES;

  if (file.size > maxBytes) {
    return NextResponse.json(
      { error: `File too large: ${Math.floor(maxBytes / 1024)}KB max.` },
      { status: 400 },
    );
  }

  let assetId: string | undefined;

  if (kind === "pack-sound") {
    const rawAssetId = form.get("assetId");
    if (typeof rawAssetId !== "string" || !SAFE_ID.test(rawAssetId)) {
      return NextResponse.json(
        { error: "Missing or invalid assetId for pack-sound upload" },
        { status: 400 },
      );
    }
    assetId = `${rawAssetId}.${AUDIO_EXTENSION}`;
  } else if (isPackAssetKind(kind)) {
    const rawAssetId = form.get("assetId");
    if (typeof rawAssetId !== "string" || !SAFE_ID.test(rawAssetId)) {
      return NextResponse.json(
        { error: `Missing or invalid assetId for ${kind} upload` },
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

  const userId = form.get("userId");
  const formToken = form.get("token");
  if (formToken === COOKIE_TOKEN && !fromSite(req)) {
    return NextResponse.json(
      { error: "Uploads must come from this site." },
      { status: 403 },
    );
  }
  const token = formToken === COOKIE_TOKEN ? await getServerToken() : formToken;
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
  const userToken = token;

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
      .getEntityPerms(userId, config.popplioTargetType, targetId)
      .catch(() => ({ perms: [] }));
    if (!hasPermString(entityPerms.perms, config.perm)) {
      return NextResponse.json(
        { error: "You don't have permission to do this." },
        { status: 403 },
      );
    }
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (!matchesDeclaredType(buffer, file.type)) {
    return NextResponse.json(
      { error: "The file's contents don't match its type." },
      { status: 400 },
    );
  }
  const key = config.key(targetId, assetId);
  const version = createHash("sha256")
    .update(buffer)
    .digest("hex")
    .slice(0, 16);

  if (isPackAssetKind(kind)) {
    try {
      if (await headObject(key)) {
        return NextResponse.json(
          { error: "That asset id is already in use. Upload it again." },
          { status: 409 },
        );
      }
    } catch (err) {
      if (!(err instanceof S3UnavailableError)) throw err;
      console.error(err, err.cause);
      return NextResponse.json(
        { error: "Storage is temporarily unavailable. Please try again." },
        { status: 503 },
      );
    }
  }

  const wrote = await putObject(key, buffer, file.type, {
    [ASSET_VERSION_METADATA_KEY]: version,
  });

  if (!wrote) {
    return NextResponse.json(
      { error: "Failed to store the uploaded file. Please try again." },
      { status: 502 },
    );
  }

  if (config.versioned && userToken) {
    await assets
      .putVersion(
        config.versioned.target,
        targetId,
        config.versioned.kind,
        version,
        userToken,
      )
      .catch((err) => {
        console.error(
          `[uploads] recording ${kind} version for ${targetId} failed:`,
          err,
        );
      });
  }

  return NextResponse.json({ ok: true, version });
}
