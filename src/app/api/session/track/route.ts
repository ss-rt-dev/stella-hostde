import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getClientIpFromRequest } from "@/lib/ip";
import { updateUserIp } from "@/lib/activity";

/** Speichert die echte Client-IP des eingeloggten Users (Vercel/CF-Header). */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const ip = getClientIpFromRequest(req);
  await updateUserIp(session.user.id, ip);

  return NextResponse.json({ ok: true, ip: ip === "unknown" ? null : ip });
}
