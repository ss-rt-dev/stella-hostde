import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: "Stella Host — Hosting, das trägt",
  description:
    "Premium Free-Hosting für Minecraft, Bots & Webprojekte. Schnell, zuverlässig, fair supportet.",
  openGraph: {
    title: "Stella Host — Hosting, das trägt",
    description:
      "Premium Free-Hosting für Minecraft, Bots & Webprojekte. Schnell, zuverlässig, fair supportet.",
    url: "https://stella-host.de",
    siteName: "Stella Host",
    images: ["https://i.postimg.cc/25RvgMy6/sh-logo.png"],
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="min-h-screen antialiased"
        style={{ background: "#060607", color: "#f6f6f4", margin: 0 }}
      >
        <Providers>{children}</Providers>
        <SpeedInsights />
      </body>
    </html>
  );
}
