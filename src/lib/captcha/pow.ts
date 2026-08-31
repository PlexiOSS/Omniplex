// Copyright (C) 2026 NodeByte LTD 

import type { CaptchaChallenge, CaptchaSolution } from "@/lib/api/types";

export async function solveCaptcha(
  challenge: CaptchaChallenge,
  maxAttempts = 20_000_000,
): Promise<CaptchaSolution> {
  const encoder = new TextEncoder();

  for (let nonce = 0; nonce < maxAttempts; nonce++) {
    const digest = await crypto.subtle.digest(
      "SHA-256",
      encoder.encode(`${challenge.salt}:${nonce}`),
    );

    if (leadingZeroBits(new Uint8Array(digest)) >= challenge.difficulty) {
      return { ...challenge, nonce: String(nonce) };
    }
  }

  throw new Error("Failed to solve captcha challenge please try again");
}

function leadingZeroBits(bytes: Uint8Array): number {
  let count = 0;
  for (const byte of bytes) {
    if (byte === 0) {
      count += 8;
      continue;
    }
    count += Math.clz32(byte) - 24;
    break;
  }
  return count;
}
