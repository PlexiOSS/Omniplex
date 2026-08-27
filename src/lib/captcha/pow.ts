import type { CaptchaChallenge, CaptchaSolution } from "@/lib/api/types";

/**
 * Solves a proof-of-work vote captcha entirely client-side: brute-forces a
 * nonce such that sha256(`${salt}:${nonce}`) has at least `difficulty`
 * leading zero bits, matching Popplio's popplio/captcha verification. This
 * is deliberately CPU-bound — the cost of finding a nonce is what makes
 * scripted mass-voting expensive, while a real browser solves it in well
 * under a second.
 *
 * maxAttempts is only a safety valve against a misconfigured/unreachable
 * difficulty hanging the tab forever; it's far above any realistic solve.
 */
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

  throw new Error("Failed to solve captcha challenge — please try again");
}

function leadingZeroBits(bytes: Uint8Array): number {
  let count = 0;
  for (const byte of bytes) {
    if (byte === 0) {
      count += 8;
      continue;
    }
    // Math.clz32 counts leading zeros across 32 bits; a byte only occupies
    // the lowest 8, so its own leading-zero count is clz32(byte) - 24.
    count += Math.clz32(byte) - 24;
    break;
  }
  return count;
}
