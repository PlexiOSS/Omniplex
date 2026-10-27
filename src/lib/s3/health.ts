// Copyright (C) 2026 NodeByte LTD

import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getS3Client } from "./client";
import { S3_BUCKET } from "./config";

export async function isCdnHealthy(): Promise<boolean> {
  try {
    await getS3Client().send(
      new ListObjectsV2Command({ Bucket: S3_BUCKET, MaxKeys: 1 }),
    );
    return true;
  } catch {
    return false;
  }
}
