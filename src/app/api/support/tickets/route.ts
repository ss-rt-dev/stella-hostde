import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendSupportTicketWebhook } from "@/lib/discord";
import { z } from "zod";

const createSchema = z
  .object({
    subject: z.string().min(3).max(120),
    description: z.string().min(10).max(5000),
    type: z.enum(["GENERAL", "SERVER", "TEAM_APPLICATION"]),
    discordName: z.string().max(64).optional(),
    applyRole: z.string().max(64).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "TEAM_APPLICATION") {
      if (!data.discordName?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Discord-Name ist Pflicht bei Team Bewerbung",
          path: ["discordName"],
        });
      }
      if (!data.applyRole?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Bitte eine Rolle wählen",
          path: ["applyRole"],
        });
      }
    }
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

    const discordName =
      parsed.type === "TEAM_APPLICATION"
        ? parsed.discordName!.trim()
        : null;
    const applyRole =
      parsed.type === "TEAM_APPLICATION" ? parsed.applyRole!.trim() : null;

    let firstMessage = parsed.description.trim();
    if (parsed.type === "TEAM_APPLICATION") {
      firstMessage =
        `**Team Bewerbung**\n` +
        `Discord: ${discordName}\n` +
        `Rolle: ${applyRole}\n\n` +
        parsed.description.trim();
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: session.user.id,
        subject: parsed.subject.trim(),
        description: parsed.description.trim(),
        type: parsed.type,
        discordName,
        applyRole,
        messages: {
          create: {
            userId: session.user.id,
            body: firstMessage,
            isStaff: false,
          },
        },
      },
    });

    void sendSupportTicketWebhook({
      ticketId: ticket.id,
      subject: ticket.subject,
      description: ticket.description,
      type: ticket.type as "GENERAL" | "SERVER" | "TEAM_APPLICATION",
      userName: user.name || "—",
      userEmail: user.email,
      discordName: discordName || undefined,
      applyRole: applyRole || undefined,
    });

    return NextResponse.json(ticket);
  } catch (e: any) {
    if (e?.name === "ZodError") {
      const msg =
        e.errors?.[0]?.message ||
        "Bitte alle Pflichtfelder korrekt ausfüllen";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
