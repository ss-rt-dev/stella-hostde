"use client";

import { usePathname } from "next/navigation";

/**
 * Leichte Slide-Animation ohne opacity:0 (sonst wirkt der erste Klick „tot“).
 * key=pathname startet die Animation direkt beim Navigieren.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="page-slide-in">
      {children}
    </div>
  );
}
