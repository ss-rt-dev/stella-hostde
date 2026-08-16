import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { DEFAULT_LOCALE, type LocaleCode } from "@/lib/i18n/locales";
import {
  isLocalePrefix,
  localeFromPrefix,
  stripLocalePrefix,
  urlPrefixForLocale,
  resolveLocaleCode,
} from "@/lib/i18n/path";

const COOKIE = "stella-locale";

function isStaticOrApi(pathname: string): boolean {
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/admin-icon") ||
    pathname.startsWith("/dashboard-icon") ||
    pathname.startsWith("/landing-icon")
  ) {
    return true;
  }
  const last = pathname.split("/").pop() || "";
  return last.includes(".") && !last.startsWith(".");
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (isStaticOrApi(pathname)) {
    return NextResponse.next();
  }

  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];

  const cookieRaw = req.cookies.get(COOKIE)?.value;
  const cookieLocale: LocaleCode = cookieRaw
    ? resolveLocaleCode(cookieRaw)
    : DEFAULT_LOCALE;

  // Pfad MIT Locale-Prefix: /en/dashboard, /lb/…, /lu/… (Alias)
  if (first && isLocalePrefix(first)) {
    const locale = localeFromPrefix(first);
    const canonical = urlPrefixForLocale(locale);
    const rest = stripLocalePrefix(pathname);
    const restPath = rest === "/" ? "" : rest;

    // Alias → kanonisch (/lu → /lb, /gb → /en)
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

    // WICHTIG: Header am Request setzen, damit Server Components sie lesen
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-pathname", rest === "/" ? "/" : rest);
    requestHeaders.set("x-locale", locale);

    const url = req.nextUrl.clone();
    url.pathname = rest === "/" ? "/" : rest;

    const res = NextResponse.rewrite(url, {
      request: { headers: requestHeaders },
    });
    res.cookies.set(COOKIE, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return res;
  }

  // Pfad OHNE Prefix: normal weiter, Header + Cookie setzen (kein Redirect-Zwang)
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);
  requestHeaders.set("x-locale", cookieLocale);

  const res = NextResponse.next({
    request: { headers: requestHeaders },
  });

  if (!cookieRaw) {
    res.cookies.set(COOKIE, cookieLocale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
