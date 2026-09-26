// Copyright (C) 2026 NodeByte LTD

export const S3_ENDPOINT = process.env.S3_ENDPOINT ?? "";
export const S3_REGION = process.env.S3_REGION || "nb-central";
export const S3_BUCKET = process.env.S3_BUCKET ?? "";
export const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID ?? "";
export const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY ?? "";

export const ASSET_VERSION_METADATA_KEY = "asset-version";

export const MIRROR_SOURCE_METADATA_KEY = "mirror-source";

export const MIRROR_CHECKED_AT_METADATA_KEY = "checked-at";
