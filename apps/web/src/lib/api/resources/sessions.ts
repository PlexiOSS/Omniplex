import { ApiError, client } from "../client";
import type {
  ApiSession,
  CreateSessionPayload,
  CreateSessionResponse,
} from "../types";

interface SessionListResponse {
  sessions: ApiSession[];
}

export const sessionsResource = {
  /** Popplio 404s with "No sessions found" instead of an empty array — normalized to [] here. */
  list: async (
    targetType: string,
    targetId: string,
    token: string,
  ): Promise<ApiSession[]> => {
    try {
      const res = await client.get<SessionListResponse>(
        `/${targetType}/${targetId}/sessions`,
        { token, cache: "no-store" },
      );
      return res.sessions;
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return [];
      throw err;
    }
  },

  create: (
    targetType: string,
    targetId: string,
    payload: CreateSessionPayload,
    token: string,
  ) =>
    client.post<CreateSessionResponse>(
      `/${targetType}/${targetId}/sessions`,
      payload,
      { token },
    ),

  revoke: (
    targetType: string,
    targetId: string,
    sessionId: string,
    token: string,
  ) =>
    client.delete<void>(
      `/${targetType}/${targetId}/sessions/${sessionId}`,
      { token },
    ),
};
