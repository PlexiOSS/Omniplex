// Copyright (C) 2026 NodeByte LTD 

export type UploadKind =
  | "partner-logo"
  | "team-avatar"
  | "team-banner"
  | "bot-banner"
  | "server-banner";

export type UploadAuth =
  | { loginToken: string }
  | { userId: string; token: string };

export class UploadError extends Error {}

export async function uploadAsset(
  kind: UploadKind,
  targetId: string,
  file: File,
  auth: UploadAuth,
): Promise<void> {
  const form = new FormData();
  form.set("kind", kind);
  form.set("targetId", targetId);
  form.set("file", file);
  if ("loginToken" in auth) {
    form.set("loginToken", auth.loginToken);
  } else {
    form.set("userId", auth.userId);
    form.set("token", auth.token);
  }

  const res = await fetch("/api/uploads", { method: "POST", body: form });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new UploadError(body?.error ?? "Upload failed.");
  }
}
