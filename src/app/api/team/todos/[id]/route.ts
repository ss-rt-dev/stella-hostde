import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isStaffRole } from "@/lib/roles";
import { logActivity } from "@/lib/activity";

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
  const staff = isStaffRole((session.user as any).role);

  const todo = await prisma.todo.findUnique({ where: { id } });
  if (!todo) {
    return NextResponse.json({ error: "Todo nicht gefunden" }, { status: 404 });
  }

  const isOwner =
    todo.createdById === session.user.id || todo.assigneeId === session.user.id;
  if (!staff && !isOwner) {
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
  if (staff && body.assigneeId !== undefined) {
    data.assigneeId = body.assigneeId || null;
  }
  if (body.dueAt !== undefined) {
    data.dueAt = body.dueAt ? new Date(body.dueAt) : null;
  }

  const updated = await prisma.todo.update({
    where: { id },
    data,
    include: {
      assignee: { select: { id: true, name: true, email: true, role: true } },
      createdBy: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  await logActivity({
    userId: session.user.id,
    action: "todo.update",
    detail: `${todo.title} → ${data.status || "update"}`,
  });

  return NextResponse.json({ todo: updated });
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
  const staff = isStaffRole((session.user as any).role);
  const todo = await prisma.todo.findUnique({ where: { id } });
  if (!todo) {
    return NextResponse.json({ error: "Todo nicht gefunden" }, { status: 404 });
  }

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
