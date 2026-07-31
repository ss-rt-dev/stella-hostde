"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * Weiche Slide-/Fade-Animation beim Wechsel zwischen Bereichen.
 * Richtung: etwas nach rechts raus / von links rein (bzw. umgekehrt bei „zurück“).
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prevPath = useRef(pathname);
  const [dir, setDir] = useState<"forward" | "back">("forward");
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    if (prevPath.current === pathname) return;
    // flachere Pfade = eher „zurück“ (z.B. /admin vs /admin/users)
    const prevDepth = prevPath.current.split("/").filter(Boolean).length;
    const nextDepth = pathname.split("/").filter(Boolean).length;
    setDir(nextDepth < prevDepth ? "back" : "forward");
    prevPath.current = pathname;
    setAnimKey((k) => k + 1);
  }, [pathname]);

  return (
    <div
      key={animKey}
      className={dir === "back" ? "page-slide-back" : "page-slide-in"}
    >
      {children}
    </div>
  );
}
