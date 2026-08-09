import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getMembership, isTeamStaff, resolveActiveTeamId } from "@/lib/teams";
import { logActivity } from "@/lib/activity";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  scope: z.enum(["PERSONAL", "TEAM"]).default("PERSONAL"),
  assigneeId: z.string().optional().nullable(),
  dueAt: z.string().datetime().optional().nullable(),
});

export async function GET(req: Request) {
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
    return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope");
  const status = searchParams.get("status");
  const staff = isTeamStaff(membership.role);

  const where: any = { teamId };

  if (scope === "TEAM") {
    where.scope = "TEAM";
  } else if (scope === "PERSONAL") {
    where.scope = "PERSONAL";
    where.OR = [
      { createdById: session.user.id },
      { assigneeId: session.user.id },
    ];
  } else {
    where.OR = [
      { scope: "TEAM" },
      { createdById: session.user.id },
      { assigneeId: session.user.id },
    ];
  }

  if (status && ["OPEN", "IN_PROGRESS", "DONE"].includes(status)) {
    where.status = status;
  }

  const todos = await prisma.todo.findMany({
    where,
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
    take: 100,
  });

  return NextResponse.json({ todos, canAssign: staff, teamId });
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
    return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
  }

  const staff = isTeamStaff(membership.role);
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });
  }

  const data = parsed.data;

  if (data.scope === "TEAM" && !staff) {
    return NextResponse.json(
      { error: "Nur Owner/Admin können Team-Todos anlegen." },
      { status: 403 }
    );
  }

  if (data.assigneeId && !staff && data.assigneeId !== session.user.id) {
    return NextResponse.json(
      { error: "Du kannst Aufgaben nur dir selbst zuweisen." },
      { status: 403 }
    );
  }

  // Assignee muss im Team sein
  if (data.assigneeId) {
    const am = await getMembership(data.assigneeId, teamId);
    if (!am) {
      return NextResponse.json(
        { error: "Assignee ist kein Team-Mitglied" },
        { status: 400 }
      );
    }
  }

  const todo = await prisma.todo.create({
    data: {
      teamId,
      title: data.title,
      description: data.description || null,
      priority: data.priority,
      scope: data.scope,
      assigneeId:
        data.assigneeId ||
        (data.scope === "PERSONAL" ? session.user.id : null),
      createdById: session.user.id,
      dueAt: data.dueAt ? new Date(data.dueAt) : null,
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  await logActivity({
    userId: session.user.id,
    action: "todo.create",
    detail: `${data.scope}: ${data.title}`,
  });

  return NextResponse.json({ todo });
}
