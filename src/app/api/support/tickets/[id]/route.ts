import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isStaffRole } from "@/lib/roles";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const { id } = await params;
  const staff = isStaffRole((session.user as any).role);

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      },
    },
  });

  if (!ticket) {
    return NextResponse.json({ error: "Ticket nicht gefunden" }, { status: 404 });
  }

  if (!staff && ticket.userId !== session.user.id) {
    return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
  }

  return NextResponse.json(ticket);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const { id } = await params;
  const staff = isStaffRole((session.user as any).role);
  const body = await req.json().catch(() => ({}));

  const ticket = await prisma.supportTicket.findUnique({ where: { id } });
  if (!ticket) {
    return NextResponse.json({ error: "Ticket nicht gefunden" }, { status: 404 });
  }

  if (!staff && ticket.userId !== session.user.id) {
    return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
  }

  if (body.status === "CLOSED" || body.status === "OPEN") {
    if (body.status === "OPEN" && !staff) {
      return NextResponse.json(
        { error: "Nur Team kann Tickets wieder öffnen" },
        { status: 403 }
      );
    }
    const updated = await prisma.supportTicket.update({
      where: { id },
      data: {
        status: body.status,
        closedAt: body.status === "CLOSED" ? new Date() : null,
      },
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Ungültige Aktion" }, { status: 400 });
}
