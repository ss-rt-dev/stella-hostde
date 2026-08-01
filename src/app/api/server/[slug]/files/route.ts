import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  hasSshConfig,
  listDir,
  readFile,
  writeFile,
  mkdir,
  removePath,
  renamePath,
  sanitizePath,
} from "@/lib/lxc-exec";
import { getServerForUser } from "@/lib/server-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(
  req: Request,
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
  if (!hasSshConfig()) {
    return NextResponse.json(
      {
        error:
          "Dateimanager: In Vercel setzen – PROXMOX_SSH_HOST (nur IP), PROXMOX_SSH_USER=root, PROXMOX_SSH_PASSWORD=… und Port 22 öffnen. Danach Redeploy.",
      },
      { status: 503 }
    );
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "list";
  const path = url.searchParams.get("path") || "/";
  const vmid = server.proxmoxVmid;

  try {
    if (action === "list") {
      const entries = await listDir(vmid, path);
      return NextResponse.json({
        path: sanitizePath(path),
        entries,
        name: server.name,
      });
    }
    if (action === "read") {
      const data = await readFile(vmid, path);
      return NextResponse.json({ path: sanitizePath(path), ...data });
    }
    return NextResponse.json({ error: "Unbekannte action" }, { status: 400 });
  } catch (e: any) {
    console.error("files GET", e);
    return NextResponse.json(
      { error: e.message || "Dateifehler" },
      { status: 502 }
    );
  }
}

export async function POST(
  req: Request,
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
  if (!hasSshConfig()) {
    return NextResponse.json(
      {
        error:
          "Dateimanager: PROXMOX_SSH_HOST / PROXMOX_SSH_PASSWORD in Vercel setzen",
      },
      { status: 503 }
    );
  }

  const vmid = server.proxmoxVmid;

  try {
    const body = await req.json();
    const action = String(body.action || "");

    if (action === "write") {
      const path = String(body.path || "");
      const content = String(body.content ?? "");
      await writeFile(vmid, path, content);
      return NextResponse.json({ ok: true, path: sanitizePath(path) });
    }
    if (action === "mkdir") {
      const path = String(body.path || "");
      await mkdir(vmid, path);
      return NextResponse.json({ ok: true, path: sanitizePath(path) });
    }
    if (action === "delete") {
      const path = String(body.path || "");
      await removePath(vmid, path);
      return NextResponse.json({ ok: true });
    }
    if (action === "rename") {
      const from = String(body.from || "");
      const to = String(body.to || "");
      await renamePath(vmid, from, to);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unbekannte action" }, { status: 400 });
  } catch (e: any) {
    console.error("files POST", e);
    return NextResponse.json(
      { error: e.message || "Dateifehler" },
      { status: 502 }
    );
  }
}
