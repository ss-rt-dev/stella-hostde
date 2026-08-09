import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMembership, TEAM_COOKIE } from "@/lib/teams";
import { z } from "zod";

const schema = z.object({
  teamId: z.string().min(1),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "teamId fehlt" }, { status: 400 });
  }

  const m = await getMembership(session.user.id, parsed.data.teamId);
  if (!m) {
    return NextResponse.json({ error: "Kein Zugriff auf dieses Team" }, { status: 403 });
  }

  const res = NextResponse.json({
    ok: true,
    team: { id: m.team.id, name: m.team.name, role: m.role },
  });
  res.cookies.set(TEAM_COOKIE, m.team.id, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
