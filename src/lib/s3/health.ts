// Server-only — see config.ts.
import { HeadBucketCommand } from "@aws-sdk/client-s3";
import { getS3Client } from "./client";
import { S3_BUCKET } from "./config";

/**
 * A real, non-swallowed check of whether the bucket is actually reachable.
 * `getObject`/`putObject` (objects.ts) deliberately treat every failure as
 * "not found" so a bucket outage never breaks a normal page — which also
 * means nothing on a normal page can tell that apart from a genuinely
 * missing file. This is the one place that still asks the question
 * honestly, for /about/status and the /api/health/cdn route.
 */
export async function isCdnHealthy(): Promise<boolean> {
  try {
    await getS3Client().send(new HeadBucketCommand({ Bucket: S3_BUCKET }));
    return true;
  } catch {
    return false;
  }
}
