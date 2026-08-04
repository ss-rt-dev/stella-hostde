"use client";

import { SessionProvider } from "next-auth/react";
import { DynamicFavicon } from "@/components/DynamicFavicon";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <DynamicFavicon />
      {children}
    </SessionProvider>
  );
}
