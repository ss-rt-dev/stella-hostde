import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMaintenanceConfig, setMaintenanceConfig } from "@/lib/settings";

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
  const config = await getMaintenanceConfig();
  return NextResponse.json(config);
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const enabled = Boolean(body.enabled);
    const schedule = {
      dateFrom: body.dateFrom ?? body.schedule?.dateFrom ?? null,
      dateTo: body.dateTo ?? body.schedule?.dateTo ?? null,
      timeFrom: body.timeFrom ?? body.schedule?.timeFrom ?? null,
      timeTo: body.timeTo ?? body.schedule?.timeTo ?? null,
    };
    const config = await setMaintenanceConfig({ enabled, schedule });
    return NextResponse.json(config);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Fehler" }, { status: 500 });
  }
}
