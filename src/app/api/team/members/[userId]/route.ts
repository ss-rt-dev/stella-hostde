import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getMembership, resolveActiveTeamId } from "@/lib/teams";
import { logActivity } from "@/lib/activity";
import { z } from "zod";

const patchSchema = z.object({
  /** Berechtigungsrolle im Team */
  role: z.enum(["ADMIN", "MEMBER"]).optional(),
  /** Anzeige-Titel nur im Team (frei wählbar) */
  title: z.string().max(40).nullable().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const { userId } = await params;
  const teamId = await resolveActiveTeamId(session.user.id);
  if (!teamId) {
    return NextResponse.json({ error: "Kein Team" }, { status: 400 });
  }

  const me = await getMembership(session.user.id, teamId);
  if (!me || me.role !== "OWNER") {
    return NextResponse.json(
      { error: "Nur der Team-Owner kann Rollen ändern" },
      { status: 403 }
    );
  }

  const target = await getMembership(userId, teamId);
  if (!target) {
    return NextResponse.json({ error: "Kein Mitglied" }, { status: 404 });
  }

  if (target.role === "OWNER") {
    return NextResponse.json(
      { error: "Owner-Rolle kann nicht geändert werden" },
      { status: 400 }
    );
  }

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });
  }

  const data: { role?: "ADMIN" | "MEMBER"; title?: string | null } = {};
  if (parsed.data.role) data.role = parsed.data.role;
  if (parsed.data.title !== undefined) {
    data.title = parsed.data.title?.trim() || null;
  }

  const updated = await prisma.teamMember.update({
    where: { id: target.id },
    data,
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  await logActivity({
    userId: session.user.id,
    action: "team.member.update",
    detail: `${updated.user.email} → ${updated.role}${updated.title ? ` (${updated.title})` : ""}`,
  });

  return NextResponse.json({
    member: {
      id: updated.user.id,
      name: updated.user.name,
      email: updated.user.email,
      role: updated.role,
      title: updated.title,
    },
  });
}
