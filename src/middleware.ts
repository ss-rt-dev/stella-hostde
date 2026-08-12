import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  DEFAULT_LOCALE,
  isLocaleCode,
  type LocaleCode,
} from "@/lib/i18n/locales";
import {
  isLocalePrefix,
  localeFromPrefix,
  stripLocalePrefix,
  withLocalePrefix,
} from "@/lib/i18n/path";

const COOKIE = "stella-locale";

function pickFromAcceptLanguage(header: string | null): LocaleCode {
  if (!header) return DEFAULT_LOCALE;
  const parts = header.split(",").map((p) => p.trim().split(";")[0].toLowerCase());
  for (const p of parts) {
    const base = p.split("-")[0];
    if (isLocaleCode(base)) return base;
  }
  return DEFAULT_LOCALE;
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // API & statische Assets ohne Locale
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];

  // 1) /gb/dashboard → rewrite intern auf /dashboard + Cookie
  if (first && isLocalePrefix(first)) {
    const locale = localeFromPrefix(first);
    const rest = stripLocalePrefix(pathname);
    const url = req.nextUrl.clone();
    url.pathname = rest;

    const res = NextResponse.rewrite(url);
    res.cookies.set(COOKIE, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    res.headers.set("x-pathname", rest);
    res.headers.set("x-locale", locale);
    return res;
  }

  // 2) /dashboard → Redirect auf /de/dashboard (Cookie oder Browser-Sprache)
  const cookieLocale = req.cookies.get(COOKIE)?.value;
  let locale: LocaleCode = DEFAULT_LOCALE;
  if (cookieLocale && isLocaleCode(cookieLocale)) {
    locale = cookieLocale;
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
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
