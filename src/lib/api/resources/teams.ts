// Copyright (C) 2026 NodeByte LTD

import { client } from "../client";
import type {
  AddTeamMemberPayload,
  CreateEditTeamPayload,
  CreateTeamResponse,
  EditTeamMemberPayload,
  PermissionData,
  SEO,
  Team,
  UserEntityPerms,
  UserVote,
} from "../types";

export const teamsResource = {
  getTeam: (id: string) =>
    client.get<Team>(`/teams/${id}?targets=team_member,bot,server`, {
      next: { revalidate: 30 },
    }),

  getSeo: (id: string) =>
    client.get<SEO>(`/teams/${id}/seo`, { next: { revalidate: 30 } }),

  createTeam: (payload: CreateEditTeamPayload, token: string) =>
    client.post<CreateTeamResponse>("/teams", payload, { token }),

  updateTeam: (teamId: string, payload: CreateEditTeamPayload, token: string) =>
    client.patch<void>(`/teams/${teamId}`, payload, { token }),

  deleteTeam: (teamId: string, token: string) =>
    client.delete<void>(`/teams/${teamId}`, { token }),

  addMember: (teamId: string, payload: AddTeamMemberPayload, token: string) =>
    client.put<void>(`/teams/${teamId}/members`, payload, { token }),

  updateMember: (
    teamId: string,
    userId: string,
    payload: EditTeamMemberPayload,
    token: string,
  ) =>
    client.patch<void>(`/teams/${teamId}/members/${userId}`, payload, {
      token,
    }),

  removeMember: (teamId: string, userId: string, token: string) =>
    client.delete<void>(`/teams/${teamId}/members/${userId}`, { token }),

  getPermissionCatalog: () =>
    client.get<{ perms: PermissionData[] }>("/teams/meta/permissions", {
      next: { revalidate: 3600 },
    }),

  getEntityPerms: (
    userId: string,
    targetType:
      | "team"
      | "bot"
      | "server"
      | "pack"
      | "pack_emoji"
      | "pack_sticker",
    targetId: string,
  ) =>
    client.get<UserEntityPerms>(
      `/users/${userId}/${targetType}/${targetId}/perms`,
      { cache: "no-store" },
    ),

  getVoteInfo: (teamId: string, userId: string, token: string) =>
    client.get<UserVote>(`/users/${userId}/teams/${teamId}/votes`, {
      token,
      cache: "no-store",
    }),

  vote: (teamId: string, userId: string, upvote: boolean, token: string) =>
    client.put<void>(
      `/users/${userId}/teams/${teamId}/votes?upvote=${upvote}`,
      {},
      { token },
    ),
};
