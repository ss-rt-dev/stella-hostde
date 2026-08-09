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
  /** Mehrere Nutzer, die die Aufgabe sehen & bearbeiten dürfen */
  assigneeIds: z.array(z.string()).max(50).optional(),
  assigneeId: z.string().optional().nullable(),
  dueAt: z.string().datetime().optional().nullable(),
  subtasks: z.array(z.string().min(1).max(200)).max(40).optional(),
});

const todoInclude = {
  assignee: { select: { id: true, name: true, email: true } },
  createdBy: { select: { id: true, name: true, email: true } },
  assignees: {
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  },
  subtasks: { orderBy: { sortOrder: "asc" as const } },
};

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
  const uid = session.user.id;

  const where: any = { teamId };

  // Sichtbarkeit: Owner/Admin sehen alles im Team.
  // Members nur: selbst erstellt ODER zugewiesen (TodoAssignee / legacy assigneeId).
  if (!staff) {
    where.OR = [
      { createdById: uid },
      { assigneeId: uid },
      { assignees: { some: { userId: uid } } },
    ];
  }

  if (scope === "TEAM") {
    where.scope = "TEAM";
  } else if (scope === "PERSONAL") {
    where.scope = "PERSONAL";
  }

  if (status && ["OPEN", "IN_PROGRESS", "DONE"].includes(status)) {
    where.status = status;
  }

  const todos = await prisma.todo.findMany({
    where,
    include: todoInclude,
    orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
    take: 100,
  });

  return NextResponse.json({
    todos: todos.map(mapTodo),
    canAssign: staff,
    teamId,
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
      { error: "Nur Owner/Admin können Team-Aufgaben anlegen." },
      { status: 403 }
    );
  }

  // IDs zusammenführen (Multi + Legacy)
  let assigneeIds = Array.from(
    new Set(
      [
        ...(data.assigneeIds || []),
        ...(data.assigneeId ? [data.assigneeId] : []),
      ].filter(Boolean)
    )
  );

  if (!staff) {
    // Members nur sich selbst
    assigneeIds = [session.user.id];
  }

  // Alle Assignees müssen Team-Mitglieder sein
  for (const aid of assigneeIds) {
    const am = await getMembership(aid, teamId);
    if (!am) {
      return NextResponse.json(
        { error: "Ein zugewiesener Nutzer ist kein Team-Mitglied" },
        { status: 400 }
      );
    }
  }

  // Team-Aufgabe ohne Auswahl: Owner/Admin sieht sie trotzdem; Members nicht.
  // Persönlich: Ersteller immer dabei
  if (data.scope === "PERSONAL" && !assigneeIds.includes(session.user.id)) {
    assigneeIds.push(session.user.id);
  }

  const todo = await prisma.todo.create({
    data: {
      teamId,
      title: data.title,
      description: data.description || null,
      priority: data.priority,
      scope: data.scope,
      assigneeId: assigneeIds[0] || null,
      createdById: session.user.id,
      dueAt: data.dueAt ? new Date(data.dueAt) : null,
      assignees: {
        create: assigneeIds.map((userId) => ({ userId })),
      },
      subtasks: data.subtasks?.length
        ? {
            create: data.subtasks.map((title, i) => ({
              title: title.trim(),
              sortOrder: i,
            })),
          }
        : undefined,
    },
    include: todoInclude,
  });

  await logActivity({
    userId: session.user.id,
    action: "todo.create",
    detail: `Aufgabe: ${data.title}`,
  });

  return NextResponse.json({ todo: mapTodo(todo) });
}

function mapTodo(t: any) {
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    scope: t.scope,
    dueAt: t.dueAt,
    createdAt: t.createdAt,
    createdBy: t.createdBy,
    assignee: t.assignee,
    assignees: (t.assignees || []).map((a: any) => a.user),
    subtasks: t.subtasks || [],
  };
}
