import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasSshConfig, testSsh } from "@/lib/lxc-exec";

export const runtime = "nodejs";
export const maxDuration = 30;

/** Admin: SSH zum Proxmox-Host testen */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if ((session.user as any).impersonatedBy) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!hasSshConfig()) {
    return NextResponse.json({
      ok: false,
      message:
        "Env fehlt: PROXMOX_SSH_HOST + PROXMOX_SSH_PASSWORD (oder PRIVATE_KEY)",
      env: {
        host: Boolean(process.env.PROXMOX_SSH_HOST),
        user: process.env.PROXMOX_SSH_USER || "root",
        password: Boolean(
          process.env.PROXMOX_SSH_PASSWORD || process.env.PROXMOX_PASSWORD
        ),
        key: Boolean(process.env.PROXMOX_SSH_PRIVATE_KEY),
        port: process.env.PROXMOX_SSH_PORT || "22",
      },
    });
  }

  const result = await testSsh();
  return NextResponse.json({
    ...result,
    env: {
      host: process.env.PROXMOX_SSH_HOST?.replace(/^https?:\/\//, "").split(":")[0],
      user: process.env.PROXMOX_SSH_USER || "root",
      password: Boolean(
        process.env.PROXMOX_SSH_PASSWORD || process.env.PROXMOX_PASSWORD
      ),
      key: Boolean(process.env.PROXMOX_SSH_PRIVATE_KEY),
      port: process.env.PROXMOX_SSH_PORT || "22",
    },
  });
}
