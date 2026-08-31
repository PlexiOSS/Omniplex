// Copyright (C) 2026 NodeByte LTD 

import { ApiError } from "@/lib/api/client";

const SERVER_ERROR_STATUSES = new Set([408, 500, 502, 503, 504]);

export function isApiUnavailable(error: unknown): boolean {
  if (error instanceof ApiError) {
    return SERVER_ERROR_STATUSES.has(error.status);
  }
  if (error instanceof TypeError && error.message.toLowerCase().includes("fetch")) {
    return true;
  }
  return false;
}

export function isBoundaryApiError(error: Error): boolean {
  if (error.name === "ApiError") return true;
  if (error.name === "TypeError" && error.message.toLowerCase().includes("fetch")) {
    return true;
  }
  return false;
}
