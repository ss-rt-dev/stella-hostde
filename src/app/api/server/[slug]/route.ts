import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServerForUser } from "@/lib/server-access";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const { slug } = await params;
  const auth = await getServerForUser(slug, session.user as any);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const server = auth.server;

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
