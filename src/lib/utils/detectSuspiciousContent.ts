// Copyright (C) 2026 NodeByte LTD 

const SUSPICIOUS_PATTERNS: RegExp[] = [
  /<\s*script\b/i,
  /javascript\s*:/i,
  /vbscript\s*:/i,
  /data\s*:\s*text\/html/i,
  /on[a-z]+\s*=\s*["']?/i,
  /<\s*svg\b/i,
  /<\s*object\b/i,
  /<\s*embed\b/i,
  /<\s*meta\b/i,
  /expression\s*\(/i,
];

export function containsSuspiciousMarkup(text: string): boolean {
  return SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(text));
}

export function suspiciousMarkupError(
  fieldLabel: string,
  text: string,
): string | null {
  if (!containsSuspiciousMarkup(text)) return null;
  return `${fieldLabel} contains markup that isn't allowed (scripts, event handlers, or similar). Remove it and try again.`;
}
