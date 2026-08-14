import { client } from "../client";
import type {
  AddTeamMemberPayload,
  CreateEditTeamPayload,
  CreateTeamResponse,
  EditTeamMemberPayload,
  PermissionData,
  Team,
  UserEntityPerms,
} from "../types";

export const teamsResource = {
  getTeam: (id: string) =>
    client.get<Team>(`/teams/${id}?targets=team_member,bot,server`, {
      next: { revalidate: 30 },
    }),

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

  /** Every flat permission a team member can hold, grouped by category */
  getPermissionCatalog: () =>
    client.get<{ perms: PermissionData[] }>("/teams/meta/permissions", {
      next: { revalidate: 3600 },
    }),

  /** A user's flattened, resolved permissions on a specific entity (public endpoint) */
  getEntityPerms: (
    userId: string,
    targetType: "team" | "bot" | "server" | "pack",
    targetId: string,
  ) =>
    client.get<UserEntityPerms>(
      `/users/${userId}/${targetType}/${targetId}/perms`,
      { cache: "no-store" },
    ),
};
