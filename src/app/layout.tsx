import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

const FAVICON = "https://cdn3.emoji.gg/emojis/40642-darkyellow.png";

export const metadata: Metadata = {
  title: "Stella Host — Hosting, das trägt",
  description:
    "Premium Free-Hosting für Minecraft, Bots & Webprojekte. Schnell, zuverlässig, fair supportet.",
  icons: {
    icon: [{ url: FAVICON, type: "image/png" }],
    shortcut: FAVICON,
    apple: FAVICON,
  },
  openGraph: {
    title: "Stella Host — Hosting, das trägt",
    description:
      "Premium Free-Hosting für Minecraft, Bots & Webprojekte. Schnell, zuverlässig, fair supportet.",
    url: "https://stella-host.de",
    siteName: "Stella Host",
    images: [FAVICON],
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
        <link rel="icon" href={FAVICON} type="image/png" />
        <link rel="apple-touch-icon" href={FAVICON} />
      </head>
      <body
        className="min-h-screen antialiased"
        style={{ background: "#060607", color: "#f6f6f4", margin: 0 }}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
