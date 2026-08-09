import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAdminRole } from "@/lib/roles";
import { getMembership, isTeamStaff } from "@/lib/teams";
import { z } from "zod";

const schema = z.object({
  body: z.string().min(1).max(4000),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const { id } = await params;
  const role = (session.user as any).role as string;

  try {
    const { body } = schema.parse(await req.json());

    const ticket = await prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) {
      return NextResponse.json({ error: "Ticket nicht gefunden" }, { status: 404 });
    }

    let staff = isAdminRole(role);
    if (ticket.teamId) {
      const m = await getMembership(session.user.id, ticket.teamId);
      if (!m) {
        return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
      }
      staff = staff || isTeamStaff(m.role);
    } else if (ticket.userId !== session.user.id && !staff) {
      return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
    }

    if (ticket.status === "CLOSED") {
      return NextResponse.json({ error: "Ticket ist geschlossen" }, { status: 400 });
    }

    const msg = await prisma.supportMessage.create({
      data: {
        ticketId: id,
        userId: session.user.id,
        body: body.trim(),
        isStaff: staff,
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    await prisma.supportTicket.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(msg);
  } catch (e: any) {
    if (e?.name === "ZodError") {
      return NextResponse.json({ error: "Nachricht zu kurz/lang" }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
