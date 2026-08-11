import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendSupportTicketWebhook } from "@/lib/discord";
import {
  getMembership,
  isTeamStaff,
  resolveActiveTeamId,
} from "@/lib/teams";
import { z } from "zod";

const createSchema = z
  .object({
    subject: z.string().min(3).max(120).optional(),
    description: z.string().min(10).max(8000).optional(),
    type: z.enum(["GENERAL", "SERVER", "TEAM_APPLICATION", "DISCORD"]),
    discordName: z.string().max(64).optional(),
    applyRole: z.string().max(64).optional(),
    realName: z.string().max(80).optional(),
    age: z.union([z.number(), z.string()]).optional(),
    availability: z.string().max(500).optional(),
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
      if (!data.realName?.trim() || data.realName.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Bitte deinen Namen angeben",
          path: ["realName"],
        });
      }
      const ageNum =
        typeof data.age === "number"
          ? data.age
          : parseInt(String(data.age ?? "").trim(), 10);
      if (!Number.isFinite(ageNum) || ageNum < 13 || ageNum > 99) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Bitte ein gültiges Alter angeben (13–99)",
          path: ["age"],
        });
      }
      if (!data.availability?.trim() || data.availability.trim().length < 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Bitte deine Verfügbarkeit angeben",
          path: ["availability"],
        });
      }
      const min = 30;
      const fields: [string, string | undefined, string][] = [
        ["aboutMe", data.aboutMe, "Erzähl mehr über dich (min. 30 Zeichen)"],
        ["whyRole", data.whyRole, "Warum willst du diese Rolle? (min. 30 Zeichen)"],
        ["whyBetter", data.whyBetter, "Warum bist du geeignet? (min. 30 Zeichen)"],
        ["contribution", data.contribution, "Was willst du beitragen? (min. 30 Zeichen)"],
      ];
      for (const [path, value, message] of fields) {
        if (!value?.trim() || value.trim().length < min) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message, path: [path] });
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
  realName: string;
  age: number;
  availability: string;
  aboutMe: string;
  whyRole: string;
  whyBetter: string;
  contribution: string;
}) {
  return [
    "【 Persönliche Angaben 】",
    `Name: ${data.realName.trim()}`,
    `Alter: ${data.age}`,
    `Verfügbarkeit: ${data.availability.trim()}`,
    "",
    "【 Über mich 】",
    data.aboutMe.trim(),
    "",
    "【 Warum diese Rolle 】",
    data.whyRole.trim(),
    "",
    "【 Warum ich geeignet bin 】",
    data.whyBetter.trim(),
    "",
    "【 Was ich beitragen will 】",
    data.contribution.trim(),
  ].join("\n");
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const teamId = await resolveActiveTeamId(session.user.id);
  if (!teamId) {
    return NextResponse.json({ error: "Kein Team gewählt" }, { status: 400 });
  }

  const membership = await getMembership(session.user.id, teamId);
  if (!membership) {
    return NextResponse.json({ error: "Kein Zugriff auf dieses Team" }, { status: 403 });
  }

  const staff = isTeamStaff(membership.role);

  const tickets = await prisma.supportTicket.findMany({
    where: { teamId },
    orderBy: { updatedAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      _count: { select: { messages: true } },
    },
  });

  return NextResponse.json({
    tickets,
    teamId,
    canManage: staff,
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const teamId = await resolveActiveTeamId(session.user.id);
  if (!teamId) {
    return NextResponse.json({ error: "Kein Team gewählt" }, { status: 400 });
  }

  const membership = await getMembership(session.user.id, teamId);
  if (!membership) {
    return NextResponse.json({ error: "Kein Zugriff auf dieses Team" }, { status: 403 });
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

    const team = await prisma.team.findUnique({ where: { id: teamId } });

    const isApp = parsed.type === "TEAM_APPLICATION";
    const discordName = isApp
      ? parsed.discordName!.trim()
      : parsed.discordName?.trim() || null;
    const applyRole = isApp ? parsed.applyRole!.trim() : null;

    let description: string;
    if (isApp) {
      const ageNum =
        typeof parsed.age === "number"
          ? parsed.age
          : parseInt(String(parsed.age).trim(), 10);
      description = buildApplicationDescription({
        realName: parsed.realName!,
        age: ageNum,
        availability: parsed.availability!,
        aboutMe: parsed.aboutMe!,
        whyRole: parsed.whyRole!,
        whyBetter: parsed.whyBetter!,
        contribution: parsed.contribution!,
      });
    } else {
      description = parsed.description!.trim();
    }

    const subject = isApp
      ? `Team-Bewerbung · ${applyRole}`
      : parsed.subject!.trim();

    // Nur Ticket – Bewerbungstext steht oben in der Übersicht, nicht als Chat-Nachricht
    const ticket = await prisma.supportTicket.create({
      data: {
        teamId,
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
      subject: `[${team?.name || "Team"}] ${ticket.subject}`,
      description: ticket.description,
      type: ticket.type as any,
      userName: user.name || "—",
      userEmail: user.email,
      discordName: discordName || undefined,
      applyRole: applyRole || undefined,
    });

    return NextResponse.json(ticket);
  } catch (e: any) {
    if (e?.name === "ZodError") {
      const msg =
        e.errors?.[0]?.message || "Bitte alle Pflichtfelder korrekt ausfüllen";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
