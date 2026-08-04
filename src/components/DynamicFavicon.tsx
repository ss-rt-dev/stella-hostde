"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

function resolveFavicon(pathname: string): { href: string; type: string } {
  if (pathname.startsWith("/admin")) {
    return { href: "/admin-icon", type: "image/png" };
  }
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/server")
  ) {
    return { href: "/dashboard-icon", type: "image/png" };
  }
  // Landing, Login, Produkte, …
  return { href: "/icon", type: "image/svg+xml" };
}

function upsertLink(rel: string, href: string, type?: string) {
  const links = document.querySelectorAll<HTMLLinkElement>(
    `link[rel="${rel}"]`
  );
  if (links.length === 0) {
    const link = document.createElement("link");
    link.rel = rel;
    link.href = href;
    if (type) link.type = type;
    document.head.appendChild(link);
    return;
  }
  links.forEach((link) => {
    link.href = href;
    if (type) link.type = type;
  });
}

/** Setzt Favicon je nach Bereich (Landing / User-Dashboard / Team). */
export function DynamicFavicon() {
  const pathname = usePathname() || "/";

  useEffect(() => {
    const { href, type } = resolveFavicon(pathname);
    // Cache-Bust, damit Browser das neue Icon sicher lädt
    const url = `${href}?v=3`;
    upsertLink("icon", url, type);
    upsertLink("shortcut icon", url, type);
    upsertLink("apple-touch-icon", url);
  }, [pathname]);

  return null;
}
