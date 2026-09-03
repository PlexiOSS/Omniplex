"use client";

import { Check, ClipboardList, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { PlatformUser } from "@/lib/api/types";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import { useAdmin } from "../../AdminContext";
import { AdminPageHeader } from "../../AdminPageHeader";
import { RpcActionModal } from "../RpcActionModal";

// Mirrors the 7 positions registered in popplio/apps/apps.go — hardcoded since
// Popplio has no live "list positions" endpoint, same reasoning as this
// codebase's other hand-maintained catalogs (see STATIC_PERMISSION_CATALOG).
const POSITION_LABELS: Record<string, string> = {
  staff: "Staff Team",
  dev: "Dev Team",
  partners: "Partners",
  resubmit: "Bot Resubmission",
  banappeal: "Ban Appeal",
  certification: "Certification",
  server_certification: "Server Certification",
};

interface Question {
  id: string;
  question: string;
  paragraph: string;
  placeholder: string;
  short: boolean;
}

interface AppResponse {
  app_id: string;
  user?: PlatformUser;
  user_id: string;
  questions: Question[];
  answers: Record<string, string>;
  state: string;
  created_at: string;
  position: string;
  review_feedback: string | null;
}

export default function AdminApplicationsPage() {
  const { loginToken, hasPerm } = useAdmin();

  const [apps, setApps] = useState<AppResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalAction, setModalAction] = useState<{
    app: AppResponse;
    approve: boolean;
  } | null>(null);

  const load = useCallback(async () => {
    try {
      const { json } = await arcadia.popplioStaff<{ apps: AppResponse[] }>(
        loginToken,
        "GET",
        "/staff/apps",
      );
      setApps((json?.apps ?? []).filter((app) => app.state === "pending"));
    } catch (err) {
      setError(
        err instanceof ArcadiaError
          ? err.message
          : "Failed to load applications.",
      );
    }
  }, [loginToken]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleModalSubmit(reason: string) {
    if (!modalAction) return;
    const { app, approve } = modalAction;
    await arcadia.popplioStaff(
      loginToken,
      "PATCH",
      `/staff/apps/${app.app_id}`,
      { approved: approve, reason },
    );
    await load();
  }

  if (error) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-center px-4 py-24 text-center"><p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!apps) {
    return (
      <div className="mx-auto flex max-w-5xl justify-center px-4 py-24"><div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-50" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <AdminPageHeader
        title="Applications"
        description={`${apps.length} pending application${apps.length === 1 ? "" : "s"} across certification, partnership, and staff programs.`}
      />

      {apps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <ClipboardList
            size={28}
            className="mb-3 text-zinc-300 dark:text-zinc-700"
          />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No pending applications right now.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          {apps.map((app) => (
            <div
              key={app.app_id}
              className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-zinc-950 dark:text-zinc-50">
                  {app.user?.display_name ?? app.user?.username ?? app.user_id}
                </span>
                <Badge>{POSITION_LABELS[app.position] ?? app.position}</Badge>
              </div>

              <dl className="mt-3 space-y-2">
                {app.questions.map((q) => (
                  <div key={q.id}>
                    <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      {q.question}
                    </dt>
                    <dd className="mt-0.5 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                      {app.answers[q.id] || "—"}
                    </dd>
                  </div>
                ))}
              </dl>

              {hasPerm("manage_apps") && (
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-900">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setModalAction({ app, approve: true })}
                  >
                    <Check size={12} />
                    Approve
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setModalAction({ app, approve: false })}
                  >
                    <X size={12} />
                    Deny
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {modalAction && (
        <RpcActionModal
          title={`${modalAction.approve ? "Approve" : "Deny"} — ${
            modalAction.app.user?.username ?? modalAction.app.user_id
          }`}
          confirmLabel={modalAction.approve ? "Approve" : "Deny"}
          danger={!modalAction.approve}
          onClose={() => setModalAction(null)}
          onSubmit={handleModalSubmit}
        />
      )}
    </div>
  );
}
