import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

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
  const servers = await prisma.server.findMany({
    where: { status: { not: "DELETED" } },
    include: {
      user: { select: { id: true, email: true, name: true } },
      package: true,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json(servers);
}
