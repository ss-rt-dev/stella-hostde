import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendSupportTicketWebhook } from "@/lib/discord";
import { z } from "zod";

const createSchema = z.object({
  subject: z.string().min(3).max(120),
  description: z.string().min(10).max(5000),
  type: z.enum(["GENERAL", "SERVER"]),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const tickets = await prisma.supportTicket.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { messages: true } },
    },
  });

  return NextResponse.json(tickets);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    if (!user) {
      return NextResponse.json({ error: "User nicht gefunden" }, { status: 404 });
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: session.user.id,
        subject: parsed.subject.trim(),
        description: parsed.description.trim(),
        type: parsed.type,
        messages: {
          create: {
            userId: session.user.id,
            body: parsed.description.trim(),
            isStaff: false,
          },
        },
      },
    });

    // Discord – nicht blockierend für den User
    void sendSupportTicketWebhook({
      ticketId: ticket.id,
      subject: ticket.subject,
      description: ticket.description,
      type: ticket.type,
      userName: user.name || "—",
      userEmail: user.email,
    });

    return NextResponse.json(ticket);
  } catch (e: any) {
    if (e?.name === "ZodError") {
      return NextResponse.json(
        { error: "Bitte Grund (min. 3) und Beschreibung (min. 10 Zeichen) angeben" },
        { status: 400 }
      );
    }
    console.error(e);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
