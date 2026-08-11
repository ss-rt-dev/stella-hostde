import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { resolveActiveTeamId, getMembership, isTeamStaff } from "@/lib/teams";
import { redirect } from "next/navigation";
import { DashboardHome } from "@/components/dashboard/DashboardHome";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const teamId = await resolveActiveTeamId(session.user.id);
  if (!teamId) redirect("/dashboard/teams");

  const membership = await getMembership(session.user.id, teamId);
  if (!membership) redirect("/dashboard/onboarding");

  const userId = session.user.id;
  const staff = isTeamStaff(membership.role);

  const [
    user,
    memberCount,
    openTeamTodos,
    myOpenTodos,
    announcements,
    recentTodos,
    platformAnnouncements,
  ] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.teamMember.count({ where: { teamId } }),
    prisma.todo.count({
      where: { teamId, scope: "TEAM", status: { not: "DONE" } },
    }),
    prisma.todo.count({
      where: {
        teamId,
        status: { not: "DONE" },
        OR: [
          { assigneeId: userId },
          { createdById: userId, scope: "PERSONAL" },
        ],
      },
    }),
    prisma.teamAnnouncement.findMany({
      where: { teamId },
      include: { author: { select: { name: true, email: true } } },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 4,
    }),
    prisma.todo.findMany({
      where: {
        teamId,
        status: { not: "DONE" },
        OR: [
          { scope: "TEAM" },
          { assigneeId: userId },
          { createdById: userId },
        ],
      },
      include: { assignee: { select: { name: true, email: true } } },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: 6,
    }),
    prisma.platformAnnouncement.findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  if (!user) return null;
  const displayName = user.name?.trim() || user.email;

  return (
    <DashboardHome
      displayName={displayName}
      teamName={membership.team.name}
      teamTitle={membership.title}
      role={membership.role}
      memberCount={memberCount}
      openTeamTodos={openTeamTodos}
      myOpenTodos={myOpenTodos}
      inviteCode={
        staff && membership.team.inviteCode ? membership.team.inviteCode : null
      }
      platformAnnouncements={platformAnnouncements.map((a) => ({
        id: a.id,
        title: a.title,
        body: a.body,
      }))}
      recentTodos={recentTodos.map((t) => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        scope: t.scope,
        assignee: t.assignee,
      }))}
      announcements={announcements.map((a) => ({
        id: a.id,
        title: a.title,
        body: a.body,
        pinned: a.pinned,
        author: a.author,
      }))}
    />
  );
}
