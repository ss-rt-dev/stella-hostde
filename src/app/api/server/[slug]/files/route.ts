import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  hasSshConfig,
  listDir,
  readFile,
  writeFile,
  writeFileBase64,
  mkdir,
  removePath,
  renamePath,
  sanitizePath,
} from "@/lib/lxc-exec";
import { getServerForUser } from "@/lib/server-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function guard(slug: string, sessionUser: any) {
  const auth = await getServerForUser(slug, sessionUser);
  if ("error" in auth) {
    return { error: NextResponse.json({ error: auth.error }, { status: auth.status }) };
  }
  const server = auth.server;
  if (!server.proxmoxVmid) {
    return {
      error: NextResponse.json({ error: "Kein Proxmox-VMID" }, { status: 400 }),
    };
  }
  if (server.status !== "RUNNING") {
    return {
      error: NextResponse.json(
        { error: `Server muss online sein (aktuell: ${server.status})` },
        { status: 400 }
      ),
    };
  }
  if (!hasSshConfig()) {
    return {
      error: NextResponse.json(
        {
          error:
            "Dateimanager: PROXMOX_SSH_HOST / PROXMOX_SSH_PASSWORD in Vercel setzen",
        },
        { status: 503 }
      ),
    };
  }
  return { server };
}

function safeFileName(name: string) {
  return name.replace(/[\\/\0]/g, "_").replace(/^\.+$/, "_") || "upload.bin";
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
  const g = await guard(slug, session.user as any);
  if ("error" in g) return g.error;
  const server = g.server!;
  const vmid = server.proxmoxVmid!;

  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "list";
  const path = url.searchParams.get("path") || "/";

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
  const g = await guard(slug, session.user as any);
  if ("error" in g) return g.error;
  const server = g.server!;
  const vmid = server.proxmoxVmid!;

  try {
    const ct = req.headers.get("content-type") || "";

    // Multipart-Upload
    if (ct.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      const dir = String(form.get("path") || "/");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "Keine Datei" }, { status: 400 });
      }
      if (file.size > 1_000_000) {
        return NextResponse.json(
          { error: "Datei zu groß (max. 1 MB pro Upload)" },
          { status: 400 }
        );
      }
      const name = safeFileName(file.name);
      const target =
        dir === "/" ? `/${name}` : `${dir.replace(/\/$/, "")}/${name}`;
      const buf = Buffer.from(await file.arrayBuffer());
      await writeFileBase64(vmid, target, buf.toString("base64"));
      return NextResponse.json({ ok: true, path: sanitizePath(target) });
    }

    const body = await req.json();
    const action = String(body.action || "");

    if (action === "upload") {
      const dir = String(body.path || "/");
      const name = safeFileName(String(body.name || "upload.bin"));
      const b64 = String(body.contentBase64 || "").replace(/\s+/g, "");
      if (!b64) {
        return NextResponse.json({ error: "Kein Inhalt" }, { status: 400 });
      }
      if (b64.length > 1_500_000) {
        return NextResponse.json(
          { error: "Datei zu groß (max. ~1 MB)" },
          { status: 400 }
        );
      }
      const target =
        dir === "/" ? `/${name}` : `${dir.replace(/\/$/, "")}/${name}`;
      await writeFileBase64(vmid, target, b64);
      return NextResponse.json({ ok: true, path: sanitizePath(target) });
    }

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
