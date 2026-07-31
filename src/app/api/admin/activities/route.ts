import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { actionLabel } from "@/lib/activity";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") return null;
  if ((session.user as any).impersonatedBy) return null;
  return session;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const list = await prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 150,
    include: {
      user: { select: { id: true, email: true, name: true } },
    },
  });
  return NextResponse.json(
    list.map((a) => ({
      id: a.id,
      action: a.action,
      label: actionLabel(a.action),
      detail: a.detail,
      createdAt: a.createdAt,
      user: a.user,
    }))
  );
}
