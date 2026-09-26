// Copyright (C) 2026 NodeByte LTD

import type { Readable } from "node:stream";
import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getS3Client } from "./client";
import { S3_BUCKET } from "./config";

export class S3UnavailableError extends Error {
  constructor(op: string, key: string, cause: unknown) {
    super(`[s3] ${op}(${key}) failed`, { cause });
    this.name = "S3UnavailableError";
  }
}

export interface ObjectMeta {
  contentType: string;
  contentLength?: number;
  lastModified?: Date;
  etag?: string;
  metadata: Record<string, string>;
}

export interface FetchedObject extends ObjectMeta {
  stream: ReadableStream;
}

export type GetObjectResult =
  | { status: "found"; object: FetchedObject }
  | { status: "not-modified"; etag?: string }
  | { status: "missing" };

export async function headObject(key: string): Promise<ObjectMeta | null> {
  try {
    const res = await getS3Client().send(
      new HeadObjectCommand({ Bucket: S3_BUCKET, Key: key }),
    );
    return {
      contentType: res.ContentType ?? "application/octet-stream",
      contentLength: res.ContentLength,
      lastModified: res.LastModified,
      etag: res.ETag,
      metadata: res.Metadata ?? {},
    };
  } catch (err) {
    if (isNotFound(err)) return null;
    throw new S3UnavailableError("headObject", key, err);
  }
}

export async function getObject(
  key: string,
  opts: { ifNoneMatch?: string | null } = {},
): Promise<GetObjectResult> {
  try {
    const res = await getS3Client().send(
      new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        IfNoneMatch: opts.ifNoneMatch ?? undefined,
      }),
    );
    if (!res.Body) return { status: "missing" };

    const sdkStream = res.Body as Readable & {
      transformToWebStream?: () => ReadableStream;
    };
    const webStream =
      typeof sdkStream.transformToWebStream === "function"
        ? sdkStream.transformToWebStream()
        : (sdkStream as unknown as ReadableStream);

    return {
      status: "found",
      object: {
        stream: webStream,
        contentType: res.ContentType ?? "application/octet-stream",
        contentLength: res.ContentLength,
        lastModified: res.LastModified,
        etag: res.ETag,
        metadata: res.Metadata ?? {},
      },
    };
  } catch (err) {
    if (statusOf(err) === 304) {
      return { status: "not-modified", etag: opts.ifNoneMatch ?? undefined };
    }
    if (isNotFound(err)) return { status: "missing" };
    throw new S3UnavailableError("getObject", key, err);
  }
}

export function discardObject(object: FetchedObject): void {
  object.stream.cancel().catch(() => {});
}

export async function putObject(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
  metadata?: Record<string, string>,
): Promise<boolean> {
  try {
    const payload = Buffer.isBuffer(body)
      ? body
      : Buffer.from(body.buffer, body.byteOffset, body.byteLength);

    await getS3Client().send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: payload,
        ContentType: contentType,
        ContentLength: payload.length,
        Metadata: metadata,
      }),
    );
    return true;
  } catch (err) {
    console.error(`[s3] putObject(${key}) failed:`, err);
    return false;
  }
}

function statusOf(err: unknown): number | undefined {
  if (err && typeof err === "object") {
    return (err as { $metadata?: { httpStatusCode?: number } }).$metadata
      ?.httpStatusCode;
  }
  return undefined;
}

function isNotFound(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const name = (err as { name?: string }).name;
  return name === "NoSuchKey" || name === "NotFound" || statusOf(err) === 404;
}
