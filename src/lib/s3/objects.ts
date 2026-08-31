// Copyright (C) 2026 NodeByte LTD 

import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
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
    logUnlessNotFound(key, err);
    return null;
  }
}

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
  const name =
    err && typeof err === "object"
      ? (err as { name?: string }).name
      : undefined;
  if (name === "NoSuchKey" || name === "NotFound") return;
  console.error(`[s3] getObject(${key}) failed:`, err);
}
