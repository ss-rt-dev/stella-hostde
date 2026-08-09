import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getMembership, isTeamStaff } from "@/lib/teams";

async function assertAccess(userId: string, todoId: string) {
  const todo = await prisma.todo.findUnique({
    where: { id: todoId },
    include: { assignees: true },
  });
  if (!todo) return null;

  const membership = await getMembership(userId, todo.teamId);
  if (!membership) return null;

  const staff = isTeamStaff(membership.role);
  const isAssigned =
    todo.createdById === userId ||
    todo.assigneeId === userId ||
    todo.assignees.some((a) => a.userId === userId);

  if (!staff && !isAssigned) return null;
  return { todo, staff };
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; subId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const { id, subId } = await params;
  if (!(await assertAccess(session.user.id, id))) {
    return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const data: any = {};
  if (typeof body.done === "boolean") data.done = body.done;
  if (typeof body.title === "string" && body.title.trim()) {
    data.title = body.title.trim().slice(0, 200);
  }

  const sub = await prisma.todoSubtask.update({
    where: { id: subId },
    data,
  });

  return NextResponse.json({ subtask: sub });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; subId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const { id, subId } = await params;
  if (!(await assertAccess(session.user.id, id))) {
    return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
  }

  await prisma.todoSubtask.delete({ where: { id: subId } });
  return NextResponse.json({ success: true });
}
