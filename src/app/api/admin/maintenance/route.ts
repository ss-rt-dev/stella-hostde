import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMaintenanceMode, setMaintenanceMode } from "@/lib/settings";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") return null;
  if ((session.user as any).impersonatedBy) return null;
  return session;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const enabled = await getMaintenanceMode();
  return NextResponse.json({ enabled });
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const enabled = Boolean(body.enabled);
    await setMaintenanceMode(enabled);
    return NextResponse.json({ enabled });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Fehler" }, { status: 500 });
  }
}
