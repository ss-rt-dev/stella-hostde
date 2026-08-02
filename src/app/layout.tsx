import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "Stella Host — Hosting, das trägt",
  description:
    "LXC-Hosting für Minecraft, Bots & Server. Schnell, zuverlässig, mit Dashboard.",
  icons: {
    icon: [{ url: "/icon", type: "image/png" }],
    shortcut: "/icon",
    apple: "/icon",
  },
  openGraph: {
    title: "Stella Host — Hosting, das trägt",
    description:
      "LXC-Hosting für Minecraft, Bots & Server. Schnell, zuverlässig, mit Dashboard.",
    url: "https://stella-host.de",
    siteName: "Stella Host",
    images: ["https://stella-host.de/icon"],
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="bg-[#0a0a0c]">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;600&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/icon" type="image/png" sizes="any" />
        <link rel="shortcut icon" href="/icon" />
        <link rel="apple-touch-icon" href="/icon" />
      </head>
      <body className="min-h-screen bg-[#0a0a0c] text-zinc-100 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
