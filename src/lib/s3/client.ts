// Copyright (C) 2026 NodeByte LTD 

import { S3Client } from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import {
  S3_ACCESS_KEY_ID,
  S3_ENDPOINT,
  S3_REGION,
  S3_SECRET_ACCESS_KEY,
} from "./config";

let client: S3Client | null = null;

const REQUEST_TIMEOUT_MS = 2500;

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
      forcePathStyle: true,
      requestHandler: new NodeHttpHandler({
        connectionTimeout: REQUEST_TIMEOUT_MS,
        requestTimeout: REQUEST_TIMEOUT_MS,
      }),
      maxAttempts: 1,
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    });
  }
  return client;
}
