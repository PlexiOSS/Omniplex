// Copyright (C) 2026 NodeByte LTD 

export const S3_ENDPOINT = process.env.S3_ENDPOINT ?? "";
export const S3_REGION = process.env.S3_REGION || "nb-central";
export const S3_BUCKET = process.env.S3_BUCKET ?? "";
export const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID ?? "";
export const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY ?? "";
export const AVATAR_MIRROR_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24h
