import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const { slug } = await params;
  const server = await prisma.server.findFirst({
    where: { accessSlug: slug, status: { not: "DELETED" } },
    include: { package: true },
  });

  if (!server) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  const isOwner = server.userId === session.user.id;
  const isAdmin = (session.user as any).role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
  }

  return NextResponse.json({
    id: server.id,
    accessSlug: server.accessSlug,
    name: server.name,
    status: server.status,
    hostname: server.hostname,
    ipAddress: server.ipAddress,
    cpu: server.cpu,
    ramMb: server.ramMb,
    diskGb: server.diskGb,
    proxmoxVmid: server.proxmoxVmid,
  });
}
