import { ARCADIA_URL } from "./config";
import type {
  AuthorizeAction,
  BaseAnalytics,
  Hello,
  MfaLogin,
  PartialEntity,
  PlatformUser,
  RPCLogEntry,
  RPCMethod,
  RPCWebAction,
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
};
