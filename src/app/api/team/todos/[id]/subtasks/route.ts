import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getMembership, isTeamStaff } from "@/lib/teams";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1).max(200),
});

async function assertTodoAccess(userId: string, todoId: string) {
  const todo = await prisma.todo.findUnique({
    where: { id: todoId },
    include: { assignees: true },
  });
  if (!todo) return { error: "Aufgabe nicht gefunden", status: 404 as const };

  const membership = await getMembership(userId, todo.teamId);
  if (!membership) return { error: "Kein Zugriff", status: 403 as const };

  const staff = isTeamStaff(membership.role);
  const isAssigned =
    todo.createdById === userId ||
    todo.assigneeId === userId ||
    todo.assignees.some((a) => a.userId === userId);

  if (!staff && !isAssigned) {
    return { error: "Keine Berechtigung", status: 403 as const };
  }

  return { todo, staff };
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const { id } = await params;
  const access = await assertTodoAccess(session.user.id, id);
  if ("error" in access && access.error) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status }
    );
  }

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Titel fehlt" }, { status: 400 });
  }

  const max = await prisma.todoSubtask.aggregate({
    where: { todoId: id },
    _max: { sortOrder: true },
  });

  const sub = await prisma.todoSubtask.create({
    data: {
      todoId: id,
      title: parsed.data.title.trim(),
      sortOrder: (max._max.sortOrder ?? -1) + 1,
    },
  });

  return NextResponse.json({ subtask: sub });
}
