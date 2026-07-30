import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  createTermProxy,
  resolveNode,
  buildTermWebsocketUrl,
  getProxmoxHost,
} from "@/lib/proxmox";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const { slug } = await params;

  const server = await prisma.server.findFirst({
    where: {
      accessSlug: slug,
      status: { not: "DELETED" },
    },
    include: { package: true },
  });

  if (!server) {
    return NextResponse.json({ error: "Server nicht gefunden" }, { status: 404 });
  }

  const isOwner = server.userId === session.user.id;
  const isAdmin = (session.user as any).role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
  }

  if (!server.proxmoxVmid) {
    return NextResponse.json({ error: "Kein Proxmox-VMID" }, { status: 400 });
  }

  if (server.status !== "RUNNING") {
    return NextResponse.json(
      { error: "Server muss online (RUNNING) sein" },
      { status: 400 }
    );
  }

  try {
    const node = await resolveNode(server.package.node);
    const proxy = await createTermProxy(node, server.proxmoxVmid);
    // proxy: { port, ticket, user, upid }
    const wsUrl = buildTermWebsocketUrl(
      node,
      server.proxmoxVmid,
      proxy.port,
      proxy.ticket
    );

    return NextResponse.json({
      wsUrl,
      ticket: proxy.ticket,
      port: proxy.port,
      user: proxy.user || process.env.PROXMOX_TOKEN_ID?.split("!")[0] || "root@pam",
      node,
      vmid: server.proxmoxVmid,
      proxmoxHost: getProxmoxHost(),
      name: server.name,
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 502 });
  }
}
