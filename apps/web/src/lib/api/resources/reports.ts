import { client } from "../client";
import type { CreateReportPayload, ReportStatCount, TargetType } from "../types";

export const reportsResource = {
  /** Reporter identity is captured server-side from the session token —
   * never sent as part of the payload, and never returned to non-staff
   * clients. See Popplio's reports package / Arcadia's ops_reports.go. */
  createReport: (
    targetType: TargetType,
    targetId: string,
    userId: string,
    payload: CreateReportPayload,
    token: string,
  ) =>
    client.put<void>(
      `/users/${userId}/${targetType}/${targetId}/reports`,
      payload,
      { token },
    ),

  /** Anonymized counts only — no report/target/reporter identity. Public,
   * unauthenticated. */
  getStats: () =>
    client.get<ReportStatCount[]>("/reports/stats", { cache: "no-store" }),
};
