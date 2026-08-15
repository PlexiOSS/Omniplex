import { ARCADIA_URL } from "./config";
import type {
  AuthorizeAction,
  BaseAnalytics,
  BlogAction,
  BlogPost,
  Hello,
  MfaLogin,
  PartialEntity,
  PartnerAction,
  Partners,
  PlatformUser,
  PopplioStaffQuery,
  Report,
  ReportAction,
  ReportStatus,
  RPCLogEntry,
  RPCMethod,
  RPCWebAction,
  StaffDisciplinaryType,
  StaffDisciplinaryTypeAction,
  StaffMember,
  StaffMemberAction,
  StaffPosition,
  StaffPositionAction,
  StartAuth,
  TargetType,
} from "./types";
import { AUTH_VERSION, HELLO_VERSION } from "./types";

export class ArcadiaError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ArcadiaError";
  }
}

/**
 * True for the specific error strings Arcadia uses to mean "this session is
 * dead, start over" (see check_auth/check_auth_insecure in the Rust source).
 * Anything else is a normal action-level error (bad input, missing perms).
 */
export function isSessionInvalid(err: unknown): boolean {
  if (!(err instanceof ArcadiaError)) return false;
  return (
    err.message === "identityExpired" || err.message === "sessionNotActive"
  );
}

/**
 * Arcadia's single endpoint, dispatching on a tagged-union JSON body. Unlike
 * Popplio, there is no consistent response envelope: success bodies are a mix
 * of JSON, raw plain text, and empty (204) depending on the action, though
 * every *error* response is consistently `(status, "message")` plain text.
 * Each action function below knows its own success shape — don't try to force
 * a single generic parser onto this.
 */
async function postQuery(body: unknown): Promise<Response> {
  return fetch(`${ARCADIA_URL}/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
}

async function assertOk(res: Response): Promise<Response> {
  if (!res.ok) {
    const message = await res.text().catch(() => res.statusText);
    throw new ArcadiaError(message, res.status);
  }
  return res;
}

export const arcadia = {
  auth: {
    begin: async (scope: string, redirectUrl: string): Promise<StartAuth> => {
      const res = await postQuery({
        Authorize: {
          version: AUTH_VERSION,
          action: {
            Begin: { scope, redirect_url: redirectUrl },
          } satisfies AuthorizeAction,
        },
      });
      return (await assertOk(res)).json();
    },

    /** Returns the raw login_token (plain text body, not JSON) for a new 'pending' session. */
    createSession: async (
      code: string,
      redirectUrl: string,
    ): Promise<string> => {
      const res = await postQuery({
        Authorize: {
          version: AUTH_VERSION,
          action: {
            CreateSession: { code, redirect_url: redirectUrl },
          } satisfies AuthorizeAction,
        },
      });
      return (await assertOk(res)).text();
    },

    checkMfaState: async (loginToken: string): Promise<MfaLogin> => {
      const res = await postQuery({
        Authorize: {
          version: AUTH_VERSION,
          action: {
            CheckMfaState: { login_token: loginToken },
          } satisfies AuthorizeAction,
        },
      });
      return (await assertOk(res)).json();
    },

    activateSession: async (loginToken: string, otp: string): Promise<void> => {
      const res = await postQuery({
        Authorize: {
          version: AUTH_VERSION,
          action: {
            ActivateSession: { login_token: loginToken, otp },
          } satisfies AuthorizeAction,
        },
      });
      await assertOk(res);
    },

    resetMfaTotp: async (loginToken: string, otp: string): Promise<void> => {
      const res = await postQuery({
        Authorize: {
          version: AUTH_VERSION,
          action: {
            ResetMfaTotp: { login_token: loginToken, otp },
          } satisfies AuthorizeAction,
        },
      });
      await assertOk(res);
    },

    logout: async (loginToken: string): Promise<void> => {
      const res = await postQuery({
        Authorize: {
          version: AUTH_VERSION,
          action: {
            Logout: { login_token: loginToken },
          } satisfies AuthorizeAction,
        },
      });
      await assertOk(res);
    },
  },

  hello: async (loginToken: string): Promise<Hello> => {
    const res = await postQuery({
      Hello: { login_token: loginToken, version: HELLO_VERSION },
    });
    return (await assertOk(res)).json();
  },

  botQueue: async (loginToken: string): Promise<PartialEntity[]> => {
    const res = await postQuery({ BotQueue: { login_token: loginToken } });
    return (await assertOk(res)).json();
  },

  baseAnalytics: async (loginToken: string): Promise<BaseAnalytics> => {
    const res = await postQuery({ BaseAnalytics: { login_token: loginToken } });
    return (await assertOk(res)).json();
  },

  getUser: async (
    loginToken: string,
    userId: string,
  ): Promise<PlatformUser> => {
    const res = await postQuery({
      GetUser: { login_token: loginToken, user_id: userId },
    });
    return (await assertOk(res)).json();
  },

  /** Success body varies by method: some return nothing (204), some (e.g. Approve) return a plain-text result. */
  executeRpc: async (
    loginToken: string,
    targetType: TargetType,
    method: RPCMethod,
  ): Promise<string | null> => {
    const res = await postQuery({
      ExecuteRpc: { login_token: loginToken, target_type: targetType, method },
    });
    await assertOk(res);
    if (res.status === 204) return null;
    const text = await res.text();
    return text || null;
  },

  getRpcMethods: async (
    loginToken: string,
    filtered: boolean,
  ): Promise<RPCWebAction[]> => {
    const res = await postQuery({
      GetRpcMethods: { login_token: loginToken, filtered },
    });
    return (await assertOk(res)).json();
  },

  getRpcLogEntries: async (loginToken: string): Promise<RPCLogEntry[]> => {
    const res = await postQuery({
      GetRpcLogEntries: { login_token: loginToken },
    });
    return (await assertOk(res)).json();
  },

  /** Only Bot and Server are implemented server-side — other target types 501. */
  searchEntitys: async (
    loginToken: string,
    targetType: TargetType,
    query: string,
  ): Promise<PartialEntity[]> => {
    const res = await postQuery({
      SearchEntitys: {
        login_token: loginToken,
        target_type: targetType,
        query,
      },
    });
    return (await assertOk(res)).json();
  },

  staffPositions: {
    list: async (loginToken: string): Promise<StaffPosition[]> => {
      const res = await postQuery({
        UpdateStaffPositions: {
          login_token: loginToken,
          action: "ListPositions" satisfies StaffPositionAction,
        },
      });
      return (await assertOk(res)).json();
    },
    swapIndex: async (
      loginToken: string,
      a: string,
      b: string,
    ): Promise<void> => {
      const res = await postQuery({
        UpdateStaffPositions: {
          login_token: loginToken,
          action: { SwapIndex: { a, b } } satisfies StaffPositionAction,
        },
      });
      await assertOk(res);
    },
    setIndex: async (
      loginToken: string,
      id: string,
      index: number,
    ): Promise<void> => {
      const res = await postQuery({
        UpdateStaffPositions: {
          login_token: loginToken,
          action: { SetIndex: { id, index } } satisfies StaffPositionAction,
        },
      });
      await assertOk(res);
    },
    create: async (
      loginToken: string,
      position: Extract<
        StaffPositionAction,
        { CreatePosition: unknown }
      >["CreatePosition"],
    ): Promise<void> => {
      const res = await postQuery({
        UpdateStaffPositions: {
          login_token: loginToken,
          action: { CreatePosition: position } satisfies StaffPositionAction,
        },
      });
      await assertOk(res);
    },
    edit: async (
      loginToken: string,
      position: Extract<
        StaffPositionAction,
        { EditPosition: unknown }
      >["EditPosition"],
    ): Promise<void> => {
      const res = await postQuery({
        UpdateStaffPositions: {
          login_token: loginToken,
          action: { EditPosition: position } satisfies StaffPositionAction,
        },
      });
      await assertOk(res);
    },
    delete: async (loginToken: string, id: string): Promise<void> => {
      const res = await postQuery({
        UpdateStaffPositions: {
          login_token: loginToken,
          action: { DeletePosition: { id } } satisfies StaffPositionAction,
        },
      });
      await assertOk(res);
    },
  },

  staffMembers: {
    list: async (loginToken: string): Promise<StaffMember[]> => {
      const res = await postQuery({
        UpdateStaffMembers: {
          login_token: loginToken,
          action: "ListMembers" satisfies StaffMemberAction,
        },
      });
      return (await assertOk(res)).json();
    },
    edit: async (
      loginToken: string,
      member: Extract<StaffMemberAction, { EditMember: unknown }>["EditMember"],
    ): Promise<void> => {
      const res = await postQuery({
        UpdateStaffMembers: {
          login_token: loginToken,
          action: { EditMember: member } satisfies StaffMemberAction,
        },
      });
      await assertOk(res);
    },
  },

  staffDisciplinaryTypes: {
    list: async (loginToken: string): Promise<StaffDisciplinaryType[]> => {
      const res = await postQuery({
        UpdateStaffDisciplinaryType: {
          login_token: loginToken,
          action: "ListDisciplinaryTypes" satisfies StaffDisciplinaryTypeAction,
        },
      });
      return (await assertOk(res)).json();
    },
    create: async (
      loginToken: string,
      type: Extract<
        StaffDisciplinaryTypeAction,
        { CreateDisciplinaryType: unknown }
      >["CreateDisciplinaryType"],
    ): Promise<void> => {
      const res = await postQuery({
        UpdateStaffDisciplinaryType: {
          login_token: loginToken,
          action: {
            CreateDisciplinaryType: type,
          } satisfies StaffDisciplinaryTypeAction,
        },
      });
      await assertOk(res);
    },
    edit: async (
      loginToken: string,
      type: Extract<
        StaffDisciplinaryTypeAction,
        { EditDisciplinaryType: unknown }
      >["EditDisciplinaryType"],
    ): Promise<void> => {
      const res = await postQuery({
        UpdateStaffDisciplinaryType: {
          login_token: loginToken,
          action: {
            EditDisciplinaryType: type,
          } satisfies StaffDisciplinaryTypeAction,
        },
      });
      await assertOk(res);
    },
    delete: async (loginToken: string, id: string): Promise<void> => {
      const res = await postQuery({
        UpdateStaffDisciplinaryType: {
          login_token: loginToken,
          action: {
            DeleteDisciplinaryType: { id },
          } satisfies StaffDisciplinaryTypeAction,
        },
      });
      await assertOk(res);
    },
  },

  blog: {
    list: async (loginToken: string): Promise<BlogPost[]> => {
      const res = await postQuery({
        UpdateBlog: {
          login_token: loginToken,
          action: "ListEntries" satisfies BlogAction,
        },
      });
      return (await assertOk(res)).json();
    },
    create: async (
      loginToken: string,
      entry: Extract<BlogAction, { CreateEntry: unknown }>["CreateEntry"],
    ): Promise<void> => {
      const res = await postQuery({
        UpdateBlog: {
          login_token: loginToken,
          action: { CreateEntry: entry } satisfies BlogAction,
        },
      });
      await assertOk(res);
    },
    edit: async (
      loginToken: string,
      entry: Extract<BlogAction, { UpdateEntry: unknown }>["UpdateEntry"],
    ): Promise<void> => {
      const res = await postQuery({
        UpdateBlog: {
          login_token: loginToken,
          action: { UpdateEntry: entry } satisfies BlogAction,
        },
      });
      await assertOk(res);
    },
    delete: async (loginToken: string, itag: string): Promise<void> => {
      const res = await postQuery({
        UpdateBlog: {
          login_token: loginToken,
          action: { DeleteEntry: { itag } } satisfies BlogAction,
        },
      });
      await assertOk(res);
    },
  },

  partners: {
    list: async (loginToken: string): Promise<Partners> => {
      const res = await postQuery({
        UpdatePartners: {
          login_token: loginToken,
          action: "List" satisfies PartnerAction,
        },
      });
      return (await assertOk(res)).json();
    },
    create: async (
      loginToken: string,
      partner: Extract<PartnerAction, { Create: unknown }>["Create"]["partner"],
    ): Promise<void> => {
      const res = await postQuery({
        UpdatePartners: {
          login_token: loginToken,
          action: { Create: { partner } } satisfies PartnerAction,
        },
      });
      await assertOk(res);
    },
    update: async (
      loginToken: string,
      partner: Extract<PartnerAction, { Update: unknown }>["Update"]["partner"],
    ): Promise<void> => {
      const res = await postQuery({
        UpdatePartners: {
          login_token: loginToken,
          action: { Update: { partner } } satisfies PartnerAction,
        },
      });
      await assertOk(res);
    },
    delete: async (loginToken: string, id: string): Promise<void> => {
      const res = await postQuery({
        UpdatePartners: {
          login_token: loginToken,
          action: { Delete: { id } } satisfies PartnerAction,
        },
      });
      await assertOk(res);
    },
  },

  /** Relays a request into Popplio's own /staff/* API — see PopplioStaffQuery's
   * doc comment. Popplio's own status code and body come back verbatim, so a
   * non-2xx here means Popplio itself rejected the request (bad input, missing
   * permission), not a broken Arcadia session — don't treat it as ArcadiaError's
   * usual "session dead" cases. Body is parsed as JSON when present; Popplio's
   * 204 responses (e.g. a successful review) come back as an empty string. */
  popplioStaff: async <T>(
    loginToken: string,
    method: string,
    path: string,
    body?: unknown,
  ): Promise<{ status: number; json: T | null }> => {
    const res = await postQuery({
      PopplioStaff: {
        login_token: loginToken,
        method,
        path,
        body: body !== undefined ? JSON.stringify(body) : "",
      } satisfies PopplioStaffQuery,
    });
    const text = await res.text();
    if (!res.ok) {
      // Popplio's error bodies are consistently { message, context } JSON —
      // same ApiErrorBody shape the normal client.ts unwraps. Fall back to
      // the raw text if it isn't JSON (an upstream 502/proxy failure, etc).
      let message = text || res.statusText;
      try {
        const parsed = JSON.parse(text) as { message?: string };
        if (parsed.message) message = parsed.message;
      } catch {
        // not JSON, use the raw text as-is
      }
      throw new ArcadiaError(message, res.status);
    }
    return { status: res.status, json: text ? (JSON.parse(text) as T) : null };
  },

  reports: {
    list: async (
      loginToken: string,
      status: ReportStatus | null,
    ): Promise<Report[]> => {
      const res = await postQuery({
        UpdateReports: {
          login_token: loginToken,
          action: { List: { status } } satisfies ReportAction,
        },
      });
      return (await assertOk(res)).json();
    },
    resolve: async (
      loginToken: string,
      id: string,
      note: string,
    ): Promise<void> => {
      const res = await postQuery({
        UpdateReports: {
          login_token: loginToken,
          action: { Resolve: { id, note } } satisfies ReportAction,
        },
      });
      await assertOk(res);
    },
    dismiss: async (
      loginToken: string,
      id: string,
      note: string,
    ): Promise<void> => {
      const res = await postQuery({
        UpdateReports: {
          login_token: loginToken,
          action: { Dismiss: { id, note } } satisfies ReportAction,
        },
      });
      await assertOk(res);
    },
  },
};
