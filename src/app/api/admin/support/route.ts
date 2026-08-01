import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isStaffRole } from "@/lib/roles";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isStaffRole((session.user as any).role)) {
    return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const where =
    status === "OPEN" || status === "CLOSED"
      ? { status: status as "OPEN" | "CLOSED" }
      : {};

  const tickets = await prisma.supportTicket.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      _count: { select: { messages: true } },
    },
  });

  return NextResponse.json(tickets);
}
