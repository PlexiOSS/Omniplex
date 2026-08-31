// Copyright (C) 2026 NodeByte LTD 

import { HeadBucketCommand } from "@aws-sdk/client-s3";
import { getS3Client } from "./client";
import { S3_BUCKET } from "./config";

export async function isCdnHealthy(): Promise<boolean> {
  try {
    await getS3Client().send(new HeadBucketCommand({ Bucket: S3_BUCKET }));
    return true;
  } catch {
    return false;
  }
}
