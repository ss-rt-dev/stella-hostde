import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isStaffRole } from "@/lib/roles";
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

  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope"); // PERSONAL | TEAM | ALL
  const status = searchParams.get("status");
  const staff = isStaffRole((session.user as any).role);

  const where: any = {};

  if (scope === "TEAM") {
    where.scope = "TEAM";
  } else if (scope === "PERSONAL") {
    where.scope = "PERSONAL";
    where.OR = [
      { createdById: session.user.id },
      { assigneeId: session.user.id },
    ];
  } else {
    // ALL: eigene + Team-Todos (Team nur sichtbar für alle eingeloggt)
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
      assignee: { select: { id: true, name: true, email: true, role: true } },
      createdBy: { select: { id: true, name: true, email: true, role: true } },
    },
    orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
    take: 100,
  });

  return NextResponse.json({ todos, canAssign: staff });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const staff = isStaffRole((session.user as any).role);
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });
  }

  const data = parsed.data;

  // Team-Todos und Zuweisung nur für Staff/Admin
  if (data.scope === "TEAM" && !staff) {
    return NextResponse.json(
      { error: "Nur Team-Mitglieder mit Admin-Rechten können Team-Todos anlegen." },
      { status: 403 }
    );
  }

  if (data.assigneeId && !staff) {
    // persönliche Todos können nur sich selbst zugewiesen werden
    if (data.assigneeId !== session.user.id) {
      return NextResponse.json(
        { error: "Du kannst Aufgaben nur dir selbst zuweisen." },
        { status: 403 }
      );
    }
  }

  const todo = await prisma.todo.create({
    data: {
      title: data.title,
      description: data.description || null,
      priority: data.priority,
      scope: data.scope,
      assigneeId: data.assigneeId || (data.scope === "PERSONAL" ? session.user.id : null),
      createdById: session.user.id,
      dueAt: data.dueAt ? new Date(data.dueAt) : null,
    },
    include: {
      assignee: { select: { id: true, name: true, email: true, role: true } },
      createdBy: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  await logActivity({
    userId: session.user.id,
    action: "todo.create",
    detail: `${data.scope}: ${data.title}`,
  });

  return NextResponse.json({ todo });
}
