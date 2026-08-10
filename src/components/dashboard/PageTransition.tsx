"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * Weiche Slide-/Fade-Animation beim Wechsel zwischen Bereichen.
 * Erster Render ohne Animation (vermeidet schwarze Seite bei opacity:0).
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prevPath = useRef(pathname);
  const [dir, setDir] = useState<"forward" | "back" | null>(null);
  const [animKey, setAnimKey] = useState(0);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      prevPath.current = pathname;
      return;
    }
    if (prevPath.current === pathname) return;
    const prevDepth = prevPath.current.split("/").filter(Boolean).length;
    const nextDepth = pathname.split("/").filter(Boolean).length;
    setDir(nextDepth < prevDepth ? "back" : "forward");
    prevPath.current = pathname;
    setAnimKey((k) => k + 1);
  }, [pathname]);

  return (
    <div
      key={animKey}
      className={
        dir === "back"
          ? "page-slide-back"
          : dir === "forward"
            ? "page-slide-in"
            : undefined
      }
    >
      {children}
    </div>
  );
}
