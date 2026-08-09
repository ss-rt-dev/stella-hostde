import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getMembership, isTeamStaff, resolveActiveTeamId } from "@/lib/teams";
import { logActivity } from "@/lib/activity";

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

async function canAccessTodo(userId: string, todo: {
  teamId: string;
  createdById: string;
  assigneeId: string | null;
}) {
  const membership = await getMembership(userId, todo.teamId);
  if (!membership) return { ok: false, staff: false };

  const staff = isTeamStaff(membership.role);
  if (staff || todo.createdById === userId || todo.assigneeId === userId) {
    return { ok: true, staff };
  }

  const assigned = await prisma.todoAssignee.findUnique({
    where: {
      todoId_userId: { todoId: (todo as any).id, userId },
    },
  }).catch(() => null);

  // fallback query
  const link = await prisma.todoAssignee.findFirst({
    where: { todoId: (todo as any).id, userId },
  });

  return { ok: Boolean(link || assigned), staff };
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
  const body = await req.json();

  const todo = await prisma.todo.findUnique({
    where: { id },
    include: { assignees: true },
  });
  if (!todo) {
    return NextResponse.json({ error: "Aufgabe nicht gefunden" }, { status: 404 });
  }

  const access = await canAccessTodo(session.user.id, todo as any);
  // Fix: pass id for assignee check
  const membership = await getMembership(session.user.id, todo.teamId);
  if (!membership) {
    return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
  }
  const staff = isTeamStaff(membership.role);
  const isAssigned =
    todo.createdById === session.user.id ||
    todo.assigneeId === session.user.id ||
    todo.assignees.some((a) => a.userId === session.user.id);

  if (!staff && !isAssigned) {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  }

  const data: any = {};
  if (body.status && ["OPEN", "IN_PROGRESS", "DONE"].includes(body.status)) {
    data.status = body.status;
  }
  if (body.priority && ["LOW", "MEDIUM", "HIGH"].includes(body.priority)) {
    data.priority = body.priority;
  }
  if (typeof body.title === "string" && body.title.trim()) {
    data.title = body.title.trim().slice(0, 200);
  }
  if (typeof body.description === "string") {
    data.description = body.description.slice(0, 5000);
  }
  if (body.dueAt !== undefined) {
    data.dueAt = body.dueAt ? new Date(body.dueAt) : null;
  }

  // Assignees nur Owner/Admin ändern
  if (staff && Array.isArray(body.assigneeIds)) {
    const ids = Array.from(new Set(body.assigneeIds.filter(Boolean))) as string[];
    for (const aid of ids) {
      const am = await getMembership(aid, todo.teamId);
      if (!am) {
        return NextResponse.json(
          { error: "Nutzer ist kein Team-Mitglied" },
          { status: 400 }
        );
      }
    }
    await prisma.todoAssignee.deleteMany({ where: { todoId: id } });
    if (ids.length) {
      await prisma.todoAssignee.createMany({
        data: ids.map((userId) => ({ todoId: id, userId })),
      });
    }
    data.assigneeId = ids[0] || null;
  }

  const updated = await prisma.todo.update({
    where: { id },
    data,
    include: todoInclude,
  });

  await logActivity({
    userId: session.user.id,
    action: "todo.update",
    detail: `${todo.title} → ${data.status || "update"}`,
  });

  return NextResponse.json({
    todo: {
      ...updated,
      assignees: updated.assignees.map((a) => a.user),
    },
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const { id } = await params;
  const todo = await prisma.todo.findUnique({ where: { id } });
  if (!todo) {
    return NextResponse.json({ error: "Aufgabe nicht gefunden" }, { status: 404 });
  }

  const membership = await getMembership(session.user.id, todo.teamId);
  const staff = membership ? isTeamStaff(membership.role) : false;

  if (!staff && todo.createdById !== session.user.id) {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  }

  await prisma.todo.delete({ where: { id } });
  await logActivity({
    userId: session.user.id,
    action: "todo.delete",
    detail: todo.title,
  });

  return NextResponse.json({ success: true });
}
