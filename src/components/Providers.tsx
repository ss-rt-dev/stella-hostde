"use client";

import { SessionProvider } from "next-auth/react";
import { DynamicFavicon } from "@/components/DynamicFavicon";
import { LanguageProvider } from "@/components/i18n/LanguageProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LanguageProvider>
        <DynamicFavicon />
        {children}
      </LanguageProvider>
    </SessionProvider>
  );
}
