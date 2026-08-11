import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminRole } from "@/lib/roles";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!isAdminRole((session?.user as any)?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const data: any = {};
  if (typeof body.active === "boolean") data.active = body.active;
  if (typeof body.title === "string") data.title = body.title.trim().slice(0, 120);
  if (typeof body.body === "string") data.body = body.body.trim().slice(0, 5000);

  const item = await prisma.platformAnnouncement.update({
    where: { id },
    data,
  });
  return NextResponse.json({ announcement: item });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!isAdminRole((session?.user as any)?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.platformAnnouncement.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
