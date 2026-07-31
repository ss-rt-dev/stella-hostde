import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { DashboardNav } from "@/components/dashboard/Nav";
import { MaintenanceScreen } from "@/components/dashboard/MaintenanceScreen";
import { getMaintenanceMode } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Stella Host Dashboard",
  description: "Stella Host – Server, Guthaben und Konto verwalten",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const impersonating = Boolean((session.user as any).impersonatedBy);
  const isRealAdmin =
    (session.user as any).role === "ADMIN" && !impersonating;
  const maintenance = await getMaintenanceMode();

  // Kunden (und Impersonation) sehen Wartungsseite wenn aktiv
  const showMaintenance = maintenance && !isRealAdmin;

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100">
      <DashboardNav user={session.user as any} />
      <main className={`lg:pl-[240px] ${impersonating ? "pt-10" : ""`}>
        <div className="mx-auto max-w-[1100px] px-4 py-5 pb-20 lg:px-6 lg:py-6 lg:pb-8">
          {showMaintenance ? <MaintenanceScreen /> : children}
        </div>
      </main>
    </div>
  );
}
