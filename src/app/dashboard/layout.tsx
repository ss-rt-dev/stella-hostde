import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { authOptions } from "@/lib/auth";
import { DashboardNav } from "@/components/dashboard/Nav";
import { PageTransition } from "@/components/dashboard/PageTransition";
import { IpTracker } from "@/components/dashboard/IpTracker";
import { getUserMemberships, resolveActiveTeamId } from "@/lib/teams";

export const metadata: Metadata = {
  title: "Stella Team Dashboard",
  description: "Stella – Teams, Todos, Mitglieder und Board",
  icons: {
    icon: [{ url: "/dashboard-icon", type: "image/png" }],
    shortcut: "/dashboard-icon",
    apple: "/dashboard-icon",
  },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const h = await headers();
  const path = h.get("x-pathname") || "";
  const isSetup =
    path === "/dashboard/onboarding" ||
    path.startsWith("/dashboard/onboarding/") ||
    path === "/dashboard/teams" ||
    path.startsWith("/dashboard/teams/");

  const memberships = await getUserMemberships(session.user.id);

  if (memberships.length === 0 && !isSetup) {
    redirect("/dashboard/onboarding");
  }

  const activeTeamId =
    memberships.length > 0 ? await resolveActiveTeamId(session.user.id) : null;

  if (memberships.length > 0 && !activeTeamId && !isSetup) {
    redirect("/dashboard/teams");
  }

  const activeMembership = activeTeamId
    ? memberships.find((m) => m.teamId === activeTeamId)
    : null;

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100">
      <IpTracker />
      <DashboardNav
        user={session.user as any}
        activeTeam={
          activeMembership
            ? {
                id: activeMembership.team.id,
                name: activeMembership.team.name,
                role: activeMembership.role,
                inviteCode:
                  activeMembership.role === "OWNER" ||
                  activeMembership.role === "ADMIN"
                    ? activeMembership.team.inviteCode
                    : undefined,
              }
            : null
        }
        teamCount={memberships.length}
        setupMode={isSetup || memberships.length === 0}
      />
      <main className="lg:pl-[240px]">
        <div className="mx-auto max-w-[1100px] px-4 py-5 pb-20 lg:px-6 lg:py-6 lg:pb-8">
          <PageTransition>{children}</PageTransition>
        </div>
      </main>
    </div>
  );
}
