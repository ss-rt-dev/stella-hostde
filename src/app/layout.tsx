import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "Stella Dashboard — Teams, Aufgaben & Support",
  description:
    "Multi-Team Workspace: Mitglieder verwalten, Aufgaben verteilen, Team-Chats und Support – alles getrennt pro Team.",
  openGraph: {
    title: "Stella Dashboard — Teams, Aufgaben & Support",
    description:
      "Multi-Team Workspace: Mitglieder verwalten, Aufgaben verteilen, Team-Chats und Support – alles getrennt pro Team.",
    url: "https://stella-host.de",
    siteName: "Stella Dashboard",
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
      </head>
      <body className="min-h-screen bg-[#0a0a0c] text-zinc-100 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
