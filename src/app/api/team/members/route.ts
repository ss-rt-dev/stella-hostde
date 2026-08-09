import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getMembership, isTeamStaff, resolveActiveTeamId } from "@/lib/teams";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const teamId = await resolveActiveTeamId(session.user.id);
  if (!teamId) {
    return NextResponse.json({ error: "Kein Team gewählt" }, { status: 400 });
  }

  const membership = await getMembership(session.user.id, teamId);
  if (!membership) {
    return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
  }

  const members = await prisma.teamMember.findMany({
    where: { teamId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          lastLoginAt: true,
          createdAt: true,
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  const openCounts = await prisma.todo.groupBy({
    by: ["assigneeId"],
    where: { teamId, status: { not: "DONE" }, assigneeId: { not: null } },
    _count: true,
  });
  const openMap = Object.fromEntries(
    openCounts.map((c) => [c.assigneeId!, c._count])
  );

  return NextResponse.json({
    members: members.map((m) => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
      lastLoginAt: m.user.lastLoginAt,
      createdAt: m.user.createdAt,
      openTasks: openMap[m.user.id] || 0,
    })),
    canManage: isTeamStaff(membership.role),
    teamId,
  });
}
