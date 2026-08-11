import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAdminRole } from "@/lib/roles";

/** Nur Platform-Admin-Tickets (audience PLATFORM) – keine neuen Tickets hier */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isAdminRole((session.user as any).role)) {
    return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const where: any = { audience: "PLATFORM" };
  if (status === "OPEN" || status === "CLOSED") {
    where.status = status;
  }

  const tickets = await prisma.supportTicket.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      team: { select: { id: true, name: true } },
      _count: { select: { messages: true } },
    },
  });

  return NextResponse.json(tickets);
}
