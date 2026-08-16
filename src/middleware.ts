import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  DEFAULT_LOCALE,
  type LocaleCode,
} from "@/lib/i18n/locales";
import {
  isLocalePrefix,
  localeFromPrefix,
  stripLocalePrefix,
  urlPrefixForLocale,
  withLocalePrefix,
  resolveLocaleCode,
} from "@/lib/i18n/path";

const COOKIE = "stella-locale";

function pickFromAcceptLanguage(header: string | null): LocaleCode {
  if (!header) return DEFAULT_LOCALE;
  const parts = header.split(",").map((p) => p.trim().split(";")[0].toLowerCase());
  for (const p of parts) {
    const resolved = resolveLocaleCode(p);
    if (resolved !== DEFAULT_LOCALE || p.startsWith("de")) return resolved;
  }
  return DEFAULT_LOCALE;
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/admin-icon") ||
    pathname.startsWith("/dashboard-icon") ||
    pathname.startsWith("/landing-icon")
  ) {
    return NextResponse.next();
  }

  const last = pathname.split("/").pop() || "";
  if (last.includes(".") && !last.startsWith(".")) {
    return NextResponse.next();
  }

  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];

  // 1) Locale-Prefix vorhanden
  if (first && isLocalePrefix(first)) {
    const locale = localeFromPrefix(first);
    const canonical = urlPrefixForLocale(locale);
    const rest = stripLocalePrefix(pathname);
    const restPath = rest === "/" ? "" : rest;

    // Alias → kanonisch: /lu → /lb, /gb → /en, /jp → /ja
    if (first.toLowerCase() !== canonical) {
      const target = `/${canonical}${restPath}${search}`;
      const res = NextResponse.redirect(new URL(target, req.url));
      res.cookies.set(COOKIE, locale, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
      return res;
    }

    const url = req.nextUrl.clone();
    url.pathname = rest === "/" ? "/" : rest;

    const res = NextResponse.rewrite(url);
    res.cookies.set(COOKIE, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    res.headers.set("x-pathname", rest === "/" ? "/" : rest);
    res.headers.set("x-locale", locale);
    return res;
  }

  // 2) Kein Prefix → Redirect auf /{lang}/…
  const cookieLocale = req.cookies.get(COOKIE)?.value;
  let locale: LocaleCode = DEFAULT_LOCALE;
  if (cookieLocale) {
    locale = resolveLocaleCode(cookieLocale);
  } else {
    locale = pickFromAcceptLanguage(req.headers.get("accept-language"));
  }

  const target = withLocalePrefix(pathname, locale) + search;
  const res = NextResponse.redirect(new URL(target, req.url));
  res.cookies.set(COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
