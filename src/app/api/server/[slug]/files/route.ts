import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function getAuthorizedServer(slug: string, sessionUser: any) {
  const server = await prisma.server.findFirst({
    where: { accessSlug: slug, status: { not: "DELETED" } },
  });
  if (!server) return { error: "Server nicht gefunden", status: 404 as const };
  const isOwner = server.userId === sessionUser.id;
  const isAdmin = sessionUser.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return { error: "Kein Zugriff", status: 403 as const };
  }
  if (!server.proxmoxVmid) {
    return { error: "Kein Proxmox-VMID", status: 400 as const };
  }
  if (server.status !== "RUNNING") {
    return { error: "Server muss online (RUNNING) sein", status: 400 as const };
  }
  if (!hasSshConfig()) {
    return {
      error:
        "Dateimanager: In Vercel setzen – PROXMOX_SSH_HOST (nur IP, z.B. 176.9.164.43), PROXMOX_SSH_USER=root, PROXMOX_SSH_PASSWORD=… und Port 22 in der Firewall öffnen. Danach Redeploy.",
      status: 503 as const,
    };
  }
  return { server };
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const { slug } = await params;
  const auth = await getAuthorizedServer(slug, session.user);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "list";
  const path = url.searchParams.get("path") || "/";
  const vmid = auth.server.proxmoxVmid!;

  try {
    if (action === "list") {
      const entries = await listDir(vmid, path);
      return NextResponse.json({
        path: sanitizePath(path),
        entries,
        name: auth.server.name,
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
  const auth = await getAuthorizedServer(slug, session.user);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const vmid = auth.server.proxmoxVmid!;

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
