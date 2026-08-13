import { client } from "../client";
import type { CaptchaChallenge } from "../types";

export const captchaResource = {
  getVoteChallenge: () =>
    client.get<CaptchaChallenge>("/votes/captcha/challenge", {
      cache: "no-store",
    }),
};
