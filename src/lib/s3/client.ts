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

// Uploads (banners, avatars, pack emojis/stickers/sounds) go up to 5MB
// (MAX_BYTES in app/api/uploads/route.ts). A 2500ms request timeout with
// zero retries left almost no margin for a brief hiccup on either end of a
// PUT that size, and every such hiccup used to silently drop the write
// (putObject swallowed the error instead of surfacing it). Reads are much
// smaller, so the larger timeout costs nothing there; maxAttempts retries a
// transient failure instead of failing outright on the first blip.
const CONNECTION_TIMEOUT_MS = 2500;
const REQUEST_TIMEOUT_MS = 15000;

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
        connectionTimeout: CONNECTION_TIMEOUT_MS,
        requestTimeout: REQUEST_TIMEOUT_MS,
      }),
      maxAttempts: 3,
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    });
  }
  return client;
}
