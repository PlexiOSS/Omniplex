import { NextResponse } from "next/server";
import { auth, teams } from "@/lib/api";
import { arcadia, ArcadiaError } from "@/lib/arcadia/client";
import { hasPermString } from "@/lib/permissions";
import { putObject } from "@/lib/s3/objects";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = new Set([
  "image/webp",
  "image/png",
  "image/jpeg",
  "image/gif",
]);

type Kind =
  | "partner-logo"
  | "team-avatar"
  | "team-banner"
  | "bot-banner"
  | "server-banner"
  | "pack-emoji";

interface KindConfig {
  /**
   * Builds the storage key. `targetId` is the entity the permission check
   * runs against (a pack's URL, for pack-emoji); `assetId` is only set for
   * kinds where one target can hold many separate uploads (a pack's many
   * emojis) and is otherwise unused.
   */
  key: (targetId: string, assetId?: string) => string;
  perm: string;
  requiresStaff: boolean;
  popplioTargetType?: "team" | "bot" | "server" | "pack";
  /** Overrides the global 5MB cap for kinds that need a tighter one. */
  maxBytes?: number;
}

// Discord's own per-emoji cap (applies to static and animated alike) — pack
// emojis follow the same limit rather than the much looser 5MB used for
// banners, since these are meant to actually behave like real emojis.
const EMOJI_MAX_BYTES = 256 * 1024;

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
    // Extension is appended separately (see assetId handling below) since
    // it depends on whether the emoji is animated, not just its ID.
    key: (packUrl, assetId) => `emojis/packs/${packUrl}/${assetId}`,
    perm: "edit_packs",
    requiresStaff: false,
    popplioTargetType: "pack",
    maxBytes: EMOJI_MAX_BYTES,
  },
};

function isKind(value: unknown): value is Kind {
  return typeof value === "string" && value in KIND_CONFIG;
}

/**
 * Single upload endpoint for every image-upload surface in the app (partner
 * logos, team avatar/banner, bot/server banner, pack emojis). Two things
 * every caller must prove before a single byte reaches the bucket:
 *
 * 1. Identity either an Arcadia staff `loginToken` (verified via
 *    `arcadia.hello`, same call the admin panel already makes on every
 *    page load) or a Popplio user session token (verified via
 *    `POST /auth/test` against targetType "user", the same primitive the
 *    token-test button uses elsewhere in the app).
 * 2. Permission on *that specific target* re-checked here server-side via
 *    Popplio's public `GET /users/{id}/{type}/{id}/perms` (staff perms come
 *    back directly from `hello`). Client-side `hasPermString` checks only
 *    ever gated the UI, never the actual write this is the real boundary.
 */
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
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Unsupported image type — use WebP, PNG, JPEG, or GIF." },
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

  if (kind === "pack-emoji") {
    const rawAssetId = form.get("assetId");
    if (typeof rawAssetId !== "string" || !rawAssetId) {
      return NextResponse.json(
        { error: "Missing assetId for pack-emoji upload" },
        { status: 400 },
      );
    }
    const animated = form.get("animated") === "true";
    if (animated !== (file.type === "image/gif")) {
      return NextResponse.json(
        {
          error: animated
            ? "Animated emojis must be uploaded as GIF."
            : "Non-animated emojis can't be uploaded as GIF.",
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

    const entityPerms = await teams
      // biome-ignore lint/style/noNonNullAssertion: every non-staff Kind sets this
      .getEntityPerms(userId, config.popplioTargetType!, targetId)
      .catch(() => ({ perms: [] }));
    if (!hasPermString(entityPerms.perms, config.perm)) {
      return NextResponse.json(
        { error: "You don't have permission to do this." },
        { status: 403 },
      );
    }
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  await putObject(config.key(targetId, assetId), bytes, file.type);

  return NextResponse.json({ ok: true });
}
