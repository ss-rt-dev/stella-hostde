"use client";

import { SessionProvider } from "next-auth/react";
import { CookieBanner } from "@/components/CookieBanner";
import { ScrollControls } from "@/components/ScrollControls";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <ScrollControls />
      <CookieBanner />
    </SessionProvider>
  );
}
