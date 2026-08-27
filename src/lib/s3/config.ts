// Server-only. Never import this from a "use client" component or anything
// that could end up in a client bundle — these are write credentials for the
// RustFS bucket, not public config. (Unlike lib/api/config.ts, nothing here
// is prefixed NEXT_PUBLIC_ on purpose.)
//
// Deliberately NOT validated at module load: `next build` evaluates route
// modules during its page-data-collection step even for fully dynamic
// routes, so throwing here would fail the build itself whenever these env
// vars aren't set in the build environment. Validation happens lazily in
// `getS3Client()`, the first point anything actually needs a real value.

// No fallback for these two: `cdn.omniplex.gg` (the obvious-looking default)
// is Cloudflare-proxied and NOT the real S3 API endpoint — silently falling
// back to it is exactly what caused a long, confusing debugging session.
// Leaving these empty when unset makes getS3Client() fail loudly/gracefully
// (see its own check) instead of quietly hitting the wrong host.
export const S3_ENDPOINT = process.env.S3_ENDPOINT ?? "";
export const S3_REGION = process.env.S3_REGION || "nb-central";
export const S3_BUCKET = process.env.S3_BUCKET ?? "";
export const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID ?? "";
export const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY ?? "";

/** How long a mirrored bot/server avatar is served from cache before
 * re-checking Discord for a fresher copy. */
export const AVATAR_MIRROR_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24h
