// Copyright (C) 2026 NodeByte LTD

import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import type { Readable } from "node:stream";
import { getS3Client } from "./client";
import { S3_BUCKET } from "./config";

export interface FetchedObject {
  stream: ReadableStream;
  contentType: string;
  contentLength?: number;
  lastModified?: Date;
  etag?: string;
}

export interface ObjectMeta {
  etag?: string;
  lastModified?: Date;
}

export async function headObject(key: string): Promise<ObjectMeta | null> {
  try {
    const res = await getS3Client().send(
      new HeadObjectCommand({ Bucket: S3_BUCKET, Key: key }),
    );
    return { etag: res.ETag, lastModified: res.LastModified };
  } catch (err) {
    logUnlessNotFound("headObject", key, err);
    return null;
  }
}

export async function getObject(key: string): Promise<FetchedObject | null> {
  try {
    const res = await getS3Client().send(
      new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }),
    );
    if (!res.Body) return null;

    const sdkStream = res.Body as Readable & { transformToWebStream?: () => ReadableStream };
    const webStream = typeof sdkStream.transformToWebStream === "function"
      ? sdkStream.transformToWebStream()
      : (sdkStream as unknown as ReadableStream);

    return {
      stream: webStream,
      contentType: res.ContentType ?? "application/octet-stream",
      contentLength: res.ContentLength,
      lastModified: res.LastModified,
      etag: res.ETag,
    };
  } catch (err) {
    logUnlessNotFound("getObject", key, err);
    return null;
  }
}

export async function putObject(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<boolean> {
  try {
    const payload = Buffer.isBuffer(body) ? body : Buffer.from(body.buffer, body.byteOffset, body.byteLength);

    await getS3Client().send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: payload,
        ContentType: contentType,
        ContentLength: payload.length,
      }),
    );
    return true;
  } catch (err) {
    console.error(`[s3] putObject(${key}) failed:`, err);
    return false;
  }
}

function logUnlessNotFound(op: string, key: string, err: unknown): void {
  if (err && typeof err === "object") {
    const e = err as { name?: string; $metadata?: { httpStatusCode?: number } };
    
    if (
      e.name === "NoSuchKey" ||
      e.name === "NotFound" ||
      e.$metadata?.httpStatusCode === 404
    ) {
      return;
    }
  }
  console.error(`[s3] ${op}(${key}) failed:`, err);
}