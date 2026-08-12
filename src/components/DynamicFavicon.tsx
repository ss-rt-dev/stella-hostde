"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { stripLocalePrefix } from "@/lib/i18n/path";

function resolveFavicon(rawPath: string): { href: string; type: string } {
  const pathname = stripLocalePrefix(rawPath);
  if (pathname.startsWith("/admin")) {
    return { href: "/admin-icon", type: "image/png" };
  }
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/server")) {
    return { href: "/dashboard-icon", type: "image/png" };
  }
  return { href: "/landing-icon", type: "image/svg+xml" };
}

function applyFavicon(href: string, type: string) {
  document
    .querySelectorAll(
      'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]'
    )
    .forEach((el) => el.remove());

  const url = `${href}?v=5`;

  const icon = document.createElement("link");
  icon.rel = "icon";
  icon.type = type;
  icon.href = url;
  document.head.appendChild(icon);

  const shortcut = document.createElement("link");
  shortcut.rel = "shortcut icon";
  shortcut.type = type;
  shortcut.href = url;
  document.head.appendChild(shortcut);

  const apple = document.createElement("link");
  apple.rel = "apple-touch-icon";
  apple.href = url;
  document.head.appendChild(apple);
}

/** Favicon je Bereich: Landing · User · Admin */
export function DynamicFavicon() {
  const pathname = usePathname() || "/";

  useEffect(() => {
    const { href, type } = resolveFavicon(pathname);
    applyFavicon(href, type);

    const observer = new MutationObserver(() => {
      const current = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
      if (!current || !current.href.includes(href.replace(/^\//, ""))) {
        applyFavicon(href, type);
      }
    });
    observer.observe(document.head, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
