import { createHash } from "node:crypto";
import { matchesDeclaredType } from "@omniplex/core/cdn/safety";
import { hasPermString } from "@omniplex/core/permissions";
import { ASSET_VERSION_METADATA_KEY } from "@omniplex/core/s3/config";
import { putObject } from "@omniplex/core/s3/objects";
import { NextResponse } from "next/server";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";

const MAX_BYTES = 5 * 1024 * 1024;
const SAFE_ID = /^[A-Za-z0-9_-]{1,100}$/;
const ALLOWED_TYPES = new Set([
  "image/webp",
  "image/png",
  "image/jpeg",
  "image/gif",
]);

function error(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return error("Invalid form data or upload body interrupted.", 400);
  }

  const kind = form.get("kind");
  const targetId = form.get("targetId");
  const file = form.get("file");
  const loginToken = form.get("loginToken");

  if (kind !== "partner-logo") return error("Invalid kind", 400);
  if (typeof targetId !== "string" || !SAFE_ID.test(targetId)) {
    return error("Invalid targetId", 400);
  }
  if (!(file instanceof File)) return error("Missing file", 400);
  if (!ALLOWED_TYPES.has(file.type)) {
    return error("Unsupported image type. Use WebP, PNG, JPEG, or GIF.", 400);
  }
  if (file.size > MAX_BYTES) {
    return error(`File too large: ${Math.floor(MAX_BYTES / 1024)}KB max.`, 400);
  }
  if (typeof loginToken !== "string" || !loginToken) {
    return error("Missing staff session", 401);
  }

  try {
    const hello = await arcadia.hello(loginToken);
    if (!hasPermString(hello.staff_member.resolved_perms, "manage_partners")) {
      return error("You don't have permission to do this.", 403);
    }
  } catch (err) {
    return error(
      "Invalid or expired staff session.",
      err instanceof ArcadiaError ? 401 : 500,
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (!matchesDeclaredType(buffer, file.type)) {
    return error("The file's contents don't match its type.", 400);
  }

  const version = createHash("sha256")
    .update(buffer)
    .digest("hex")
    .slice(0, 16);

  const wrote = await putObject(
    `avatars/partners/${targetId}.webp`,
    buffer,
    file.type,
    { [ASSET_VERSION_METADATA_KEY]: version },
  );

  if (!wrote) {
    return error("Failed to store the uploaded file. Please try again.", 502);
  }

  return NextResponse.json({ ok: true, version });
}
