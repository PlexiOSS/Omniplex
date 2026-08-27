/**
 * Client-side mirror of Popplio's `noxss` validator (state/xss.go) — same
 * patterns, same reasoning. This exists to reject a payload before it's
 * even submitted, giving an immediate, specific error instead of a generic
 * "Failed to file report" surfaced from the API's rejection. The API
 * validation is the actual enforcement; this is just a faster, friendlier
 * first pass for anyone hitting these forms directly rather than through a
 * script trying to bypass the frontend.
 *
 * Deliberately does NOT flag <iframe> — the markdown renderer
 * (components/markdown) allows it by explicit product decision (bot-owner
 * embeds), so flagging it here would reject legitimate submissions.
 */
const SUSPICIOUS_PATTERNS: RegExp[] = [
  /<\s*script\b/i,
  /javascript\s*:/i,
  /vbscript\s*:/i,
  /data\s*:\s*text\/html/i,
  /on[a-z]+\s*=\s*["']?/i, // onerror=, onload=, onclick=, ...
  /<\s*svg\b/i,
  /<\s*object\b/i,
  /<\s*embed\b/i,
  /<\s*meta\b/i,
  /expression\s*\(/i, // legacy CSS expression() injection
];

/** True if `text` contains a pattern that only makes sense as an XSS payload attempt. */
export function containsSuspiciousMarkup(text: string): boolean {
  return SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Convenience for form `validate()` functions: returns a ready-to-show
 * error string naming the field, or null if the field is clean.
 */
export function suspiciousMarkupError(
  fieldLabel: string,
  text: string,
): string | null {
  if (!containsSuspiciousMarkup(text)) return null;
  return `${fieldLabel} contains markup that isn't allowed (scripts, event handlers, or similar). Remove it and try again.`;
}
