import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendSupportTicketWebhook } from "@/lib/discord";
import { z } from "zod";

const createSchema = z
  .object({
    subject: z.string().min(3).max(120).optional(),
    description: z.string().min(10).max(8000).optional(),
    type: z.enum(["GENERAL", "SERVER", "TEAM_APPLICATION"]),
    discordName: z.string().max(64).optional(),
    applyRole: z.string().max(64).optional(),
    aboutMe: z.string().max(2000).optional(),
    whyRole: z.string().max(2000).optional(),
    whyBetter: z.string().max(2000).optional(),
    contribution: z.string().max(2000).optional(),
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
      const min = 30;
      const fields: [string, string | undefined, string][] = [
        ["aboutMe", data.aboutMe, "Erzähl mehr über dich (min. 30 Zeichen)"],
        ["whyRole", data.whyRole, "Warum willst du diese Rolle? (min. 30 Zeichen)"],
        [
          "whyBetter",
          data.whyBetter,
          "Warum bist du geeignet / besser als andere? (min. 30 Zeichen)",
        ],
        [
          "contribution",
          data.contribution,
          "Was willst du verbessern oder wo helfen? (min. 30 Zeichen)",
        ],
      ];
      for (const [path, value, message] of fields) {
        if (!value?.trim() || value.trim().length < min) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message,
            path: [path],
          });
        }
      }
    } else {
      if (!data.subject?.trim() || data.subject.trim().length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Bitte einen Betreff angeben (min. 3 Zeichen)",
          path: ["subject"],
        });
      }
      if (!data.description?.trim() || data.description.trim().length < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Bitte eine Beschreibung angeben (min. 10 Zeichen)",
          path: ["description"],
        });
      }
    }
  });

function buildApplicationDescription(data: {
  aboutMe: string;
  whyRole: string;
  whyBetter: string;
  contribution: string;
}) {
  return [
    "【 Über mich 】",
    data.aboutMe.trim(),
    "",
    "【 Warum diese Rolle 】",
    data.whyRole.trim(),
    "",
    "【 Warum ich geeignet bin 】",
    data.whyBetter.trim(),
    "",
    "【 Was ich verbessern / woran ich helfen will 】",
    data.contribution.trim(),
  ].join("\n");
}

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

    const isApp = parsed.type === "TEAM_APPLICATION";
    const discordName = isApp ? parsed.discordName!.trim() : null;
    const applyRole = isApp ? parsed.applyRole!.trim() : null;

    const description = isApp
      ? buildApplicationDescription({
          aboutMe: parsed.aboutMe!,
          whyRole: parsed.whyRole!,
          whyBetter: parsed.whyBetter!,
          contribution: parsed.contribution!,
        })
      : parsed.description!.trim();

    const subject = isApp
      ? `Team-Bewerbung · ${applyRole}`
      : parsed.subject!.trim();

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: session.user.id,
        subject,
        description,
        type: parsed.type,
        discordName,
        applyRole,
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
