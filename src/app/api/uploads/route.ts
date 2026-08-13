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
  | "server-banner";

interface KindConfig {
  key: (id: string) => string;
  perm: string;
  requiresStaff: boolean;
  popplioTargetType?: "team" | "bot" | "server";
}

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
};

function isKind(value: unknown): value is Kind {
  return typeof value === "string" && value in KIND_CONFIG;
}

/**
 * Single upload endpoint for every image-upload surface in the app (partner
 * logos, team avatar/banner, bot/server banner). Two things every caller
 * must prove before a single byte reaches the bucket:
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
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File too large — 5MB max." },
      { status: 400 },
    );
  }

  const config = KIND_CONFIG[kind];

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
  await putObject(config.key(targetId), bytes, file.type);

  return NextResponse.json({ ok: true });
}
