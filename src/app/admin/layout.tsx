import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { DashboardNav } from "@/components/dashboard/Nav";
import { PageTransition } from "@/components/dashboard/PageTransition";
import { LanguageButton } from "@/components/i18n/LanguageButton";
import { isAdminRole } from "@/lib/roles";

export const metadata: Metadata = {
  title: "Stella Platform Admin",
  description: "Stella – Plattform-Verwaltung",
  icons: {
    icon: [{ url: "/admin-icon", type: "image/png" }],
    shortcut: "/admin-icon",
    apple: "/admin-icon",
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = (session.user as any).role as string;
  if (!isAdminRole(role)) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100">
      <DashboardNav user={session.user as any} platformAdmin />
      <main className="lg:pl-[240px]">
        <div className="mx-auto max-w-[1200px] px-4 py-5 pb-24 lg:px-6 lg:py-6 lg:pb-8">
          <PageTransition>{children}</PageTransition>
        </div>
      </main>
      <LanguageButton />
    </div>
  );
}
