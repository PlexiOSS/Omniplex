// Server-only — see config.ts.
import { S3Client } from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import {
  S3_ACCESS_KEY_ID,
  S3_ENDPOINT,
  S3_REGION,
  S3_SECRET_ACCESS_KEY,
} from "./config";

let client: S3Client | null = null;

/** Every avatar/banner across the site now depends on this instead of
 * hotlinking Discord directly — a slow or unreachable bucket used to mean
 * nothing (Discord's own CDN just served the image), but now it means
 * every image on every page waits on it. Cap how long any single call can
 * take so a bad backend fails fast into the existing 404 → generated-avatar
 * fallback instead of hanging the page for seconds per image. */
const REQUEST_TIMEOUT_MS = 2500;

/** Lazily-created singleton — env vars are only required once something
 * actually needs to talk to the bucket, not at module load / build time. */
export function getS3Client(): S3Client {
  if (!client) {
    if (!S3_ENDPOINT || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY) {
      throw new Error(
        "Missing S3_ENDPOINT/S3_ACCESS_KEY_ID/S3_SECRET_ACCESS_KEY env vars for CDN access",
      );
    }
    client = new S3Client({
      endpoint: S3_ENDPOINT,
      region: S3_REGION,
      credentials: {
        accessKeyId: S3_ACCESS_KEY_ID,
        secretAccessKey: S3_SECRET_ACCESS_KEY,
      },
      // RustFS (like most self-hosted S3-compatible stores) expects
      // path-style requests (https://host/bucket/key) rather than AWS's
      // virtual-hosted-style (https://bucket.host/key).
      forcePathStyle: true,
      requestHandler: new NodeHttpHandler({
        connectionTimeout: REQUEST_TIMEOUT_MS,
        requestTimeout: REQUEST_TIMEOUT_MS,
      }),
      // The SDK's default retry behavior triples the worst case (up to 3
      // attempts × REQUEST_TIMEOUT_MS each) for something that's supposed
      // to fail fast into a fallback, not resiliently keep trying.
      maxAttempts: 1,
    });
  }
  return client;
}
