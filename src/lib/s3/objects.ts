import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { S3_BUCKET } from "./config";
import { getS3Client } from "./client";

export interface FetchedObject {
  stream: ReadableStream;
  contentType: string;
  contentLength?: number;
  lastModified?: Date;
  /** RustFS's ETag for this object version — changes on every putObject, so
   * it's what lets /cdn/[...path] tell a browser "your cached copy is
   * stale" the instant someone re-uploads a banner/avatar, instead of
   * waiting out a fixed cache lifetime. */
  etag?: string;
}

/**
 * Every one of these swallows its own errors (missing/misconfigured env
 * vars, a slow or unreachable bucket, a genuine 404 — all of it) and
 * degrades to "as if the object doesn't exist" rather than throwing. This
 * is deliberately more permissive than typical error handling: every
 * caller sits behind an image the whole site now depends on rendering
 * *something* usable (a real image, or the existing 404 → generated-avatar
 * fallback) — a bucket outage should never surface as a broken page or a
 * hung request. Genuine misconfiguration still shows up in the server log.
 */
export async function getObject(key: string): Promise<FetchedObject | null> {
  try {
    const res = await getS3Client().send(
      new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }),
    );
    if (!res.Body) return null;
    return {
      // biome-ignore lint/suspicious/noExplicitAny: SdkStreamMixin isn't exported as a usable type here
      stream: (res.Body as any).transformToWebStream(),
      contentType: res.ContentType ?? "application/octet-stream",
      contentLength: res.ContentLength,
      lastModified: res.LastModified,
      etag: res.ETag,
    };
  } catch (err) {
    logUnlessNotFound(key, err);
    return null;
  }
}

/** Best-effort — a failed cache write should never block serving the image
 * that was already successfully fetched. */
export async function putObject(
  key: string,
  body: Uint8Array,
  contentType: string,
): Promise<void> {
  try {
    await getS3Client().send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  } catch (err) {
    console.error(`[s3] putObject(${key}) failed:`, err);
  }
}

function logUnlessNotFound(key: string, err: unknown): void {
  const name = err && typeof err === "object" ? (err as { name?: string }).name : undefined;
  if (name === "NoSuchKey" || name === "NotFound") return;
  console.error(`[s3] getObject(${key}) failed:`, err);
}
