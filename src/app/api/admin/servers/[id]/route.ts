import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deleteLxc, startLxc, stopLxc, resolveNode } from "@/lib/proxmox";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return null;
  }
  return session;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { action } = await req.json();

  const server = await prisma.server.findUnique({
    where: { id },
    include: { package: true },
  });

  if (!server || !server.proxmoxVmid) {
    return NextResponse.json({ error: "Server nicht gefunden" }, { status: 404 });
  }

  try {
    const node = await resolveNode(server.package.node);

    if (action === "start") {
      await startLxc(node, server.proxmoxVmid);
      await prisma.server.update({ where: { id }, data: { status: "RUNNING" } });
    } else if (action === "stop") {
      await stopLxc(node, server.proxmoxVmid);
      await prisma.server.update({ where: { id }, data: { status: "STOPPED" } });
    } else {
      return NextResponse.json({ error: "Ungültige Aktion" }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const server = await prisma.server.findUnique({
    where: { id },
    include: { package: true },
  });

  if (!server) {
    return NextResponse.json({ error: "Server nicht gefunden" }, { status: 404 });
  }

  try {
    if (server.proxmoxVmid) {
      try {
        const node = await resolveNode(server.package.node);
        await deleteLxc(node, server.proxmoxVmid);
      } catch (e) {
        console.error("Proxmox delete:", e);
      }
    }
    await prisma.server.update({
      where: { id },
      data: { status: "DELETED" },
    });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
