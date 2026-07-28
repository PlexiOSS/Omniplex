import { API_URL } from "./config";
import type { ApiErrorBody } from "./types";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly ctx?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = {
  token?: string;
  cache?: RequestCache;
  next?: NextFetchRequestConfig;
};

async function request<T>(
  path: string,
  init: RequestInit & RequestOptions = {},
): Promise<T> {
  const { token, cache, next, ...rest } = init;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `User ${token}` } : {}),
    ...(rest.headers as Record<string, string>),
  };

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers,
    cache,
    next,
  });

  if (!res.ok) {
    let body: ApiErrorBody = { message: res.statusText };
    try {
      body = (await res.json()) as ApiErrorBody;
    } catch {
      // keep default
    }
    throw new ApiError(body.message ?? res.statusText, res.status, body.context);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

export const client = {
  get<T>(path: string, opts?: RequestOptions) {
    return request<T>(path, { method: "GET", ...opts });
  },
  post<T>(path: string, body: unknown, opts?: RequestOptions) {
    return request<T>(path, {
      method: "POST",
      body: JSON.stringify(body),
      ...opts,
    });
  },
  patch<T>(path: string, body: unknown, opts?: RequestOptions) {
    return request<T>(path, {
      method: "PATCH",
      body: JSON.stringify(body),
      ...opts,
    });
  },
  put<T>(path: string, body: unknown, opts?: RequestOptions) {
    return request<T>(path, {
      method: "PUT",
      body: JSON.stringify(body),
      ...opts,
    });
  },
  delete<T>(path: string, opts?: RequestOptions) {
    return request<T>(path, { method: "DELETE", ...opts });
  },
};
