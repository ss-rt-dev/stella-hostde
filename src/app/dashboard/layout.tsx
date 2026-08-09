import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { authOptions } from "@/lib/auth";
import { DashboardNav } from "@/components/dashboard/Nav";
import { PageTransition } from "@/components/dashboard/PageTransition";
import { getUserMemberships, resolveActiveTeamId } from "@/lib/teams";
import { prisma } from "@/lib/db";

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
  const path = h.get("x-pathname") || h.get("x-invoke-path") || "";
  // Fallback: next url header
  const url = h.get("x-url") || h.get("referer") || "";
  const isOnboarding =
    path.includes("/dashboard/onboarding") ||
    path.includes("/dashboard/teams") ||
    url.includes("/dashboard/onboarding") ||
    url.includes("/dashboard/teams");

  const memberships = await getUserMemberships(session.user.id);
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { onboardingDone: true },
  });

  // Kein Team → Onboarding (außer schon dort)
  if (memberships.length === 0 && !isOnboarding) {
    redirect("/dashboard/onboarding");
  }

  // Teams vorhanden aber keins gewählt → Team-Auswahl
  const activeTeamId = memberships.length
    ? await resolveActiveTeamId(session.user.id)
    : null;

  if (memberships.length > 0 && !activeTeamId && !isOnboarding) {
    redirect("/dashboard/teams");
  }

  const activeMembership = activeTeamId
    ? memberships.find((m) => m.teamId === activeTeamId)
    : null;

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100">
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
      />
      <main className="lg:pl-[240px]">
        <div className="mx-auto max-w-[1100px] px-4 py-5 pb-20 lg:px-6 lg:py-6 lg:pb-8">
          <PageTransition>{children}</PageTransition>
        </div>
      </main>
    </div>
  );
}
