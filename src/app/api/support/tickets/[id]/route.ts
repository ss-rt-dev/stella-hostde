import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAdminRole } from "@/lib/roles";
import { getMembership, isTeamStaff } from "@/lib/teams";

async function canAccessTicket(
  userId: string,
  role: string,
  ticket: { teamId: string | null; userId: string; audience: string }
) {
  if (isAdminRole(role)) return { ok: true, staff: true };

  if (ticket.audience === "PLATFORM") {
    // Nur Ersteller (oder Platform Admin oben)
    return { ok: ticket.userId === userId, staff: false };
  }

  if (!ticket.teamId) {
    return { ok: ticket.userId === userId, staff: false };
  }

  const m = await getMembership(userId, ticket.teamId);
  if (!m) return { ok: false, staff: false };
  return { ok: true, staff: isTeamStaff(m.role) };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const { id } = await params;
  const role = (session.user as any).role as string;

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      team: { select: { id: true, name: true } },
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

  const access = await canAccessTicket(session.user.id, role, ticket as any);
  if (!access.ok) {
    return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
  }

  return NextResponse.json({ ...ticket, canManage: access.staff });
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
  const role = (session.user as any).role as string;
  const body = await req.json().catch(() => ({}));

  const ticket = await prisma.supportTicket.findUnique({ where: { id } });
  if (!ticket) {
    return NextResponse.json({ error: "Ticket nicht gefunden" }, { status: 404 });
  }

  const access = await canAccessTicket(session.user.id, role, ticket as any);
  if (!access.ok) {
    return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
  }

  if (body.status === "CLOSED" || body.status === "OPEN") {
    if (body.status === "OPEN" && !access.staff) {
      return NextResponse.json(
        { error: "Nur Staff können Tickets wieder öffnen" },
        { status: 403 }
      );
    }
    if (
      body.status === "CLOSED" &&
      !access.staff &&
      ticket.userId !== session.user.id
    ) {
      return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
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
