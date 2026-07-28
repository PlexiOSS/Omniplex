import { client } from "../client";
import type { UpdateUserPayload, User, UserPerm } from "../types";

export const usersResource = {
  getUser: (userId: string, token?: string) =>
    client.get<User>(`/users/${userId}`, token
      ? { token, cache: "no-store" }
      : { next: { revalidate: 60 } },
    ),

  updateUser: (userId: string, payload: UpdateUserPayload, token: string) =>
    client.patch<User>(`/users/${userId}`, payload, { token }),

  getPerms: (userId: string, token: string) =>
    client.get<UserPerm>(`/users/${userId}/perms`, { token, cache: "no-store" }),
};
