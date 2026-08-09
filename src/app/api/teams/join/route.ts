import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isValidInviteCodeFormat, normalizeInviteCode } from "@/lib/teams";
import { logActivity } from "@/lib/activity";
import { z } from "zod";

const schema = z.object({
  code: z.string().min(5).max(16),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Code fehlt" }, { status: 400 });
  }

  const code = normalizeInviteCode(parsed.data.code);
  if (!isValidInviteCodeFormat(code)) {
    return NextResponse.json(
      { error: "Format: Buchstaben + 3 Ziffern (z.B. STEL742)" },
      { status: 400 }
    );
  }

  const team = await prisma.team.findUnique({ where: { inviteCode: code } });
  if (!team) {
    return NextResponse.json({ error: "Einladungscode ungültig" }, { status: 404 });
  }

  const existing = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: { teamId: team.id, userId: session.user.id },
    },
  });
  if (existing) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { onboardingDone: true },
    });
    return NextResponse.json({
      team: { id: team.id, name: team.name, role: existing.role },
      alreadyMember: true,
    });
  }

  const member = await prisma.teamMember.create({
    data: {
      teamId: team.id,
      userId: session.user.id,
      role: "MEMBER",
    },
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { onboardingDone: true },
  });

  await logActivity({
    userId: session.user.id,
    action: "team.join",
    detail: team.name,
  });

  return NextResponse.json({
    team: { id: team.id, name: team.name, role: member.role },
  });
}
