import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isStaffRole } from "@/lib/roles";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const members = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      lastLoginAt: true,
      createdAt: true,
      _count: {
        select: {
          todosAssigned: { where: { status: { not: "DONE" } } },
        },
      },
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({
    members: members.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      role: m.role,
      lastLoginAt: m.lastLoginAt,
      createdAt: m.createdAt,
      openTasks: m._count.todosAssigned,
    })),
    canManage: isStaffRole((session.user as any).role),
  });
}
