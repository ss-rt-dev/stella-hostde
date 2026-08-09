import type { NextRequest } from "next/server";

/**
 * Client-IP hinter Vercel / Cloudflare / Nginx.
 * Reihenfolge: CF → x-real-ip → erstes x-forwarded-for → unknown
 */
export function getClientIp(
  headers: Headers | Record<string, string | string[] | undefined>
): string {
  const get = (key: string): string | null => {
    if (headers instanceof Headers) {
      return headers.get(key);
    }
    const v = headers[key] ?? headers[key.toLowerCase()];
    if (Array.isArray(v)) return v[0] ?? null;
    return typeof v === "string" ? v : null;
  };

  const candidates = [
    get("cf-connecting-ip"),
    get("true-client-ip"),
    get("x-real-ip"),
    get("x-vercel-forwarded-for"),
    get("x-forwarded-for"),
  ];

  for (const raw of candidates) {
    if (!raw) continue;
    // x-forwarded-for kann "client, proxy1, proxy2" sein
    const first = raw.split(",")[0]?.trim();
    if (first && isPlausibleIp(first)) return first;
  }

  return "unknown";
}

export function getClientIpFromRequest(req: Request | NextRequest): string {
  return getClientIp(req.headers);
}

function isPlausibleIp(ip: string): boolean {
  // IPv4
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) return true;
  // IPv6 (vereinfacht)
  if (ip.includes(":") && /^[0-9a-fA-F:.]+$/.test(ip)) return true;
  return false;
}
