import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  createTermProxy,
  resolveNode,
  buildTermWebsocketUrl,
  getProxmoxHost,
} from "@/lib/proxmox";
import { getServerForUser } from "@/lib/server-access";

export async function POST(
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

  if (!server.proxmoxVmid) {
    return NextResponse.json({ error: "Kein Proxmox-VMID" }, { status: 400 });
  }

  if (server.status !== "RUNNING") {
    return NextResponse.json(
      { error: `Server muss online sein (aktuell: ${server.status})` },
      { status: 400 }
    );
  }

  try {
    const node = await resolveNode(server.package?.node);
    const proxy = await createTermProxy(node, server.proxmoxVmid);
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
      accessSlug: server.accessSlug,
    });
  } catch (e: any) {
    console.error("console termproxy", e);
    return NextResponse.json(
      {
        error:
          e.message ||
          "Proxmox termproxy fehlgeschlagen – PROXMOX_HOST / Login prüfen",
      },
      { status: 502 }
    );
  }
}
