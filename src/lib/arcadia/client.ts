// Copyright (C) 2026 NodeByte LTD 

import { ARCADIA_URL } from "./config";
import { touchArcadiaSession } from "./session";
import type {
  AuthorizeAction,
  BadgeAction,
  BadgeCatalogEntry,
  BaseAnalytics,
  BlogAction,
  BlogPost,
  BotWhitelist,
  BotWhitelistAction,
  ChangelogAction,
  ChangelogDraft,
  ChangelogEntry,
  ChangelogGenerateRequest,
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
  ShopCoupon,
  ShopCouponAction,
  ShopItem,
  ShopItemAction,
  ShopItemBenefit,
  ShopItemBenefitAction,
  StaffDisciplinaryType,
  StaffDisciplinaryTypeAction,
  StaffMember,
  StaffMemberAction,
  StaffPosition,
  StaffPositionAction,
  StaffTemplateAction,
  StaffTemplateUpsert,
  StartAuth,
  TargetType,
  VoteCreditTier,
  VoteCreditTierAction,
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

export function isSessionInvalid(err: unknown): boolean {
  if (!(err instanceof ArcadiaError)) return false;
  return (
    err.message === "identityExpired" || err.message === "sessionNotActive"
  );
}

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
  touchArcadiaSession();
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

  serverQueue: async (loginToken: string): Promise<PartialEntity[]> => {
    const res = await postQuery({ ServerQueue: { login_token: loginToken } });
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

  shopItemBenefits: {
    list: async (loginToken: string): Promise<ShopItemBenefit[]> => {
      const res = await postQuery({
        UpdateShopItemBenefits: {
          login_token: loginToken,
          action: "List" satisfies ShopItemBenefitAction,
        },
      });
      return (await assertOk(res)).json();
    },
    create: async (
      loginToken: string,
      benefit: Extract<ShopItemBenefitAction, { Create: unknown }>["Create"],
    ): Promise<void> => {
      const res = await postQuery({
        UpdateShopItemBenefits: {
          login_token: loginToken,
          action: { Create: benefit } satisfies ShopItemBenefitAction,
        },
      });
      await assertOk(res);
    },
    edit: async (
      loginToken: string,
      benefit: Extract<ShopItemBenefitAction, { Edit: unknown }>["Edit"],
    ): Promise<void> => {
      const res = await postQuery({
        UpdateShopItemBenefits: {
          login_token: loginToken,
          action: { Edit: benefit } satisfies ShopItemBenefitAction,
        },
      });
      await assertOk(res);
    },
    delete: async (loginToken: string, id: string): Promise<void> => {
      const res = await postQuery({
        UpdateShopItemBenefits: {
          login_token: loginToken,
          action: { Delete: { id } } satisfies ShopItemBenefitAction,
        },
      });
      await assertOk(res);
    },
  },

  shopItems: {
    list: async (loginToken: string): Promise<ShopItem[]> => {
      const res = await postQuery({
        UpdateShopItems: {
          login_token: loginToken,
          action: "List" satisfies ShopItemAction,
        },
      });
      return (await assertOk(res)).json();
    },
    create: async (
      loginToken: string,
      item: Extract<ShopItemAction, { Create: unknown }>["Create"],
    ): Promise<void> => {
      const res = await postQuery({
        UpdateShopItems: {
          login_token: loginToken,
          action: { Create: item } satisfies ShopItemAction,
        },
      });
      await assertOk(res);
    },
    edit: async (
      loginToken: string,
      item: Extract<ShopItemAction, { Edit: unknown }>["Edit"],
    ): Promise<void> => {
      const res = await postQuery({
        UpdateShopItems: {
          login_token: loginToken,
          action: { Edit: item } satisfies ShopItemAction,
        },
      });
      await assertOk(res);
    },
    delete: async (loginToken: string, id: string): Promise<void> => {
      const res = await postQuery({
        UpdateShopItems: {
          login_token: loginToken,
          action: { Delete: { id } } satisfies ShopItemAction,
        },
      });
      await assertOk(res);
    },
  },

  voteCreditTiers: {
    list: async (loginToken: string): Promise<VoteCreditTier[]> => {
      const res = await postQuery({
        UpdateVoteCreditTiers: {
          login_token: loginToken,
          action: "ListTiers" satisfies VoteCreditTierAction,
        },
      });
      return (await assertOk(res)).json();
    },
    create: async (
      loginToken: string,
      tier: Extract<
        VoteCreditTierAction,
        { CreateTier: unknown }
      >["CreateTier"],
    ): Promise<void> => {
      const res = await postQuery({
        UpdateVoteCreditTiers: {
          login_token: loginToken,
          action: { CreateTier: tier } satisfies VoteCreditTierAction,
        },
      });
      await assertOk(res);
    },
    edit: async (
      loginToken: string,
      tier: Extract<VoteCreditTierAction, { EditTier: unknown }>["EditTier"],
    ): Promise<void> => {
      const res = await postQuery({
        UpdateVoteCreditTiers: {
          login_token: loginToken,
          action: { EditTier: tier } satisfies VoteCreditTierAction,
        },
      });
      await assertOk(res);
    },
    delete: async (loginToken: string, id: string): Promise<void> => {
      const res = await postQuery({
        UpdateVoteCreditTiers: {
          login_token: loginToken,
          action: { DeleteTier: { id } } satisfies VoteCreditTierAction,
        },
      });
      await assertOk(res);
    },
  },

  shopCoupons: {
    list: async (loginToken: string): Promise<ShopCoupon[]> => {
      const res = await postQuery({
        UpdateShopCoupons: {
          login_token: loginToken,
          action: "List" satisfies ShopCouponAction,
        },
      });
      return (await assertOk(res)).json();
    },
    create: async (
      loginToken: string,
      coupon: Extract<ShopCouponAction, { Create: unknown }>["Create"],
    ): Promise<void> => {
      const res = await postQuery({
        UpdateShopCoupons: {
          login_token: loginToken,
          action: { Create: coupon } satisfies ShopCouponAction,
        },
      });
      await assertOk(res);
    },
    edit: async (
      loginToken: string,
      coupon: Extract<ShopCouponAction, { Edit: unknown }>["Edit"],
    ): Promise<void> => {
      const res = await postQuery({
        UpdateShopCoupons: {
          login_token: loginToken,
          action: { Edit: coupon } satisfies ShopCouponAction,
        },
      });
      await assertOk(res);
    },
    delete: async (loginToken: string, id: string): Promise<void> => {
      const res = await postQuery({
        UpdateShopCoupons: {
          login_token: loginToken,
          action: { Delete: { id } } satisfies ShopCouponAction,
        },
      });
      await assertOk(res);
    },
  },

  botWhitelist: {
    list: async (loginToken: string): Promise<BotWhitelist[]> => {
      const res = await postQuery({
        UpdateBotWhitelist: {
          login_token: loginToken,
          action: "List" satisfies BotWhitelistAction,
        },
      });
      return (await assertOk(res)).json();
    },
    add: async (
      loginToken: string,
      entry: Extract<BotWhitelistAction, { Add: unknown }>["Add"],
    ): Promise<void> => {
      const res = await postQuery({
        UpdateBotWhitelist: {
          login_token: loginToken,
          action: { Add: entry } satisfies BotWhitelistAction,
        },
      });
      await assertOk(res);
    },
    edit: async (
      loginToken: string,
      entry: Extract<BotWhitelistAction, { Edit: unknown }>["Edit"],
    ): Promise<void> => {
      const res = await postQuery({
        UpdateBotWhitelist: {
          login_token: loginToken,
          action: { Edit: entry } satisfies BotWhitelistAction,
        },
      });
      await assertOk(res);
    },
    delete: async (loginToken: string, botId: string): Promise<void> => {
      const res = await postQuery({
        UpdateBotWhitelist: {
          login_token: loginToken,
          action: { Delete: { bot_id: botId } } satisfies BotWhitelistAction,
        },
      });
      await assertOk(res);
    },
  },

  badges: {
    list: async (loginToken: string): Promise<BadgeCatalogEntry[]> => {
      const res = await postQuery({
        UpdateBadges: {
          login_token: loginToken,
          action: "List" satisfies BadgeAction,
        },
      });
      return (await assertOk(res)).json();
    },
    create: async (
      loginToken: string,
      badge: Extract<BadgeAction, { Create: unknown }>["Create"],
    ): Promise<void> => {
      const res = await postQuery({
        UpdateBadges: {
          login_token: loginToken,
          action: { Create: badge } satisfies BadgeAction,
        },
      });
      await assertOk(res);
    },
    edit: async (
      loginToken: string,
      badge: Extract<BadgeAction, { Edit: unknown }>["Edit"],
    ): Promise<void> => {
      const res = await postQuery({
        UpdateBadges: {
          login_token: loginToken,
          action: { Edit: badge } satisfies BadgeAction,
        },
      });
      await assertOk(res);
    },
    delete: async (loginToken: string, id: string): Promise<void> => {
      const res = await postQuery({
        UpdateBadges: {
          login_token: loginToken,
          action: { Delete: { id } } satisfies BadgeAction,
        },
      });
      await assertOk(res);
    },
  },

  staffTemplates: {
    list: async (loginToken: string): Promise<StaffTemplateUpsert[]> => {
      const res = await postQuery({
        UpdateStaffTemplates: {
          login_token: loginToken,
          action: "List" satisfies StaffTemplateAction,
        },
      });
      return (await assertOk(res)).json();
    },
    create: async (
      loginToken: string,
      template: Extract<StaffTemplateAction, { Create: unknown }>["Create"],
    ): Promise<void> => {
      const res = await postQuery({
        UpdateStaffTemplates: {
          login_token: loginToken,
          action: { Create: template } satisfies StaffTemplateAction,
        },
      });
      await assertOk(res);
    },
    edit: async (
      loginToken: string,
      template: Extract<StaffTemplateAction, { Edit: unknown }>["Edit"],
    ): Promise<void> => {
      const res = await postQuery({
        UpdateStaffTemplates: {
          login_token: loginToken,
          action: { Edit: template } satisfies StaffTemplateAction,
        },
      });
      await assertOk(res);
    },
    delete: async (loginToken: string, id: string): Promise<void> => {
      const res = await postQuery({
        UpdateStaffTemplates: {
          login_token: loginToken,
          action: { Delete: { id } } satisfies StaffTemplateAction,
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

  changelog: {
    list: async (loginToken: string): Promise<ChangelogEntry[]> => {
      const res = await postQuery({
        UpdateChangelog: {
          login_token: loginToken,
          action: "ListEntries" satisfies ChangelogAction,
        },
      });
      return (await assertOk(res)).json();
    },
    create: async (
      loginToken: string,
      entry: Extract<ChangelogAction, { CreateEntry: unknown }>["CreateEntry"],
    ): Promise<void> => {
      const res = await postQuery({
        UpdateChangelog: {
          login_token: loginToken,
          action: { CreateEntry: entry } satisfies ChangelogAction,
        },
      });
      await assertOk(res);
    },
    edit: async (
      loginToken: string,
      entry: Extract<ChangelogAction, { UpdateEntry: unknown }>["UpdateEntry"],
    ): Promise<void> => {
      const res = await postQuery({
        UpdateChangelog: {
          login_token: loginToken,
          action: { UpdateEntry: entry } satisfies ChangelogAction,
        },
      });
      await assertOk(res);
    },
    delete: async (loginToken: string, itag: string): Promise<void> => {
      const res = await postQuery({
        UpdateChangelog: {
          login_token: loginToken,
          action: { DeleteEntry: { itag } } satisfies ChangelogAction,
        },
      });
      await assertOk(res);
    },
    generate: async (
      loginToken: string,
      req: ChangelogGenerateRequest,
    ): Promise<ChangelogDraft> => {
      const res = await postQuery({
        UpdateChangelog: {
          login_token: loginToken,
          action: { Generate: req } satisfies ChangelogAction,
        },
      });
      return (await assertOk(res)).json();
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
      let message = text || res.statusText;
      try {
        const parsed = JSON.parse(text) as { message?: string };
        if (parsed.message) message = parsed.message;
      } catch {}
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
