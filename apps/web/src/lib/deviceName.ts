export interface Device {
  browser: string;
  os: string | null;
  mobile: boolean;
}

const LEGACY = /^(.+?) \(on (.*?)\) \[mobile: (true|false)\]$/;
const MOBILE_OS = /^(ios|android|ipados)$/i;

export function parseDevice(name: string | null): Device {
  const raw = (name ?? "").trim();
  if (!raw) return { browser: "Unknown browser", os: null, mobile: false };

  const legacy = LEGACY.exec(raw);
  if (legacy) {
    const os = legacy[2].replace(/\s+[\d.]+$/, "").trim() || null;
    return { browser: legacy[1], os, mobile: legacy[3] === "true" };
  }

  const split = raw.lastIndexOf(" on ");
  if (split > 0) {
    const os = raw.slice(split + 4).trim();
    return { browser: raw.slice(0, split), os, mobile: MOBILE_OS.test(os) };
  }

  return { browser: raw, os: null, mobile: false };
}

export function deviceLabel(device: Device): string {
  return device.os ? `${device.browser} on ${device.os}` : device.browser;
}
