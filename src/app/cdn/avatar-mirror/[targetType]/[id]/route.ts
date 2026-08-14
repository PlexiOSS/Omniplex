import { NextResponse } from "next/server";
import { DISCORD_CDN_URL } from "@/lib/api/config";
import { AVATAR_MIRROR_MAX_AGE_MS } from "@/lib/s3/config";
import { getObject, putObject } from "@/lib/s3/objects";

/** Every legitimate `?src=` value is a Discord avatar URL — dovewing only
 * ever resolves PlatformUser.avatar to cdn.discordapp.com. Anything else is
 * either a stale/dead value (see mirroredAvatarUrl's isDeadCdnUrl) or, since
 * this is a public unauthenticated route, a caller trying to make this
 * server fetch (and then cache-poison the shared bucket with) an arbitrary
 * URL — classic SSRF. Reject before ever calling fetch(), not after. */
const DISCORD_CDN_HOST = new URL(DISCORD_CDN_URL).hostname;

function isAllowedAvatarSrc(src: string): boolean {
  try {
    const url = new URL(src);
    return url.protocol === "https:" && url.hostname === DISCORD_CDN_HOST;
  } catch {
    return false;
  }
}

interface Params {
  params: Promise<{ targetType: string; id: string }>;
}

const VALID_TARGET_TYPES = new Set(["bots", "servers", "users"]);

/**
 * Bot/server/user avatars aren't uploads — they're Discord's own avatar,
 * synced live via dovewing/Infernoplex. This mirrors a copy into the RustFS
 * bucket
 * on first request and re-serves it for `AVATAR_MIRROR_MAX_AGE_MS`, then
 * quietly re-mirrors past that window — cuts down on repeated hits to
 * Discord's CDN. Caller passes `?src=<current avatar URL>` as the fallback
 * source; this route never calls back into Popplio to look it up itself.
 *
 * Lives under `/cdn/avatar-mirror/...`, not `/cdn/avatars/...` — see the
 * comment on `mirroredAvatarUrl` in `lib/utils/assets.ts` for why that
 * distinction matters (it used to collide with the static-asset proxy).
 *
 * One S3 round trip in the common case (cached and fresh): `getObject`
 * doubles as the staleness check via its own `lastModified`, instead of a
 * separate HEAD request first. A failed Discord re-fetch or cache write
 * falls back to serving the stale-but-already-fetched cached copy rather
 * than erroring — a slightly-stale avatar beats a broken one.
 *
 * Last resort, when there's no cache *and* no usable `?src=` (some
 * PlatformUser.avatar values are stale dead-CDN URLs — see
 * `mirroredAvatarUrl` — leaving nothing to mirror from): fall back to the
 * historical migrated avatar at `avatars/{targetType}/{id}.webp`, left over
 * from before dovewing's live sync took over. A real (if possibly outdated)
 * Discord avatar beats a generated placeholder, and Popplio's only live
 * re-resolution route (`GET /bots/{client_id}/meta`) requires user/team
 * auth this route has no way to obtain from an <img> request.
 */
export async function GET(req: Request, { params }: Params) {
  const { targetType, id } = await params;
  if (!VALID_TARGET_TYPES.has(targetType) || !id) {
    return new NextResponse("Not found", { status: 404 });
  }

  const key = `avatars/${targetType}/${id}`;
  const rawSrc = new URL(req.url).searchParams.get("src");
  const liveSrc = rawSrc && isAllowedAvatarSrc(rawSrc) ? rawSrc : null;

  const cached = await getObject(key);
  const isStale =
    !cached?.lastModified ||
    Date.now() - cached.lastModified.getTime() > AVATAR_MIRROR_MAX_AGE_MS;

  if ((!cached || isStale) && liveSrc) {
    const mirrored = await fetchFromDiscord(liveSrc);
    if (mirrored) {
      // Best-effort — doesn't block serving these freshly-fetched bytes.
      putObject(key, mirrored.body, mirrored.contentType);
      return new NextResponse(mirrored.body as BodyInit, {
        headers: {
          "Content-Type": mirrored.contentType,
          "Cache-Control": "public, max-age=3600",
        },
      });
    }
  }

  if (cached) {
    return new NextResponse(cached.stream, {
      headers: {
        "Content-Type": cached.contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  const legacy = await getObject(`${key}.webp`);
  if (legacy) {
    return new NextResponse(legacy.stream, {
      headers: {
        "Content-Type": legacy.contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  return new NextResponse("Not found", { status: 404 });
}

async function fetchFromDiscord(
  liveSrc: string,
): Promise<{ body: Uint8Array; contentType: string } | null> {
  try {
    const res = await fetch(liveSrc, { signal: AbortSignal.timeout(2500) });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "image/webp";
    const body = new Uint8Array(await res.arrayBuffer());
    return { body, contentType };
  } catch {
    return null;
  }
}
