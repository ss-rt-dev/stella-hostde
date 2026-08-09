import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  MAX_OWNED_TEAMS,
  countOwnedTeams,
  getUserMemberships,
  uniqueInviteCode,
} from "@/lib/teams";
import { logActivity } from "@/lib/activity";
import { z } from "zod";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const memberships = await getUserMemberships(session.user.id);
  const owned = await countOwnedTeams(session.user.id);
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { onboardingDone: true },
  });

  return NextResponse.json({
    teams: memberships.map((m) => ({
      id: m.team.id,
      name: m.team.name,
      inviteCode: m.role === "OWNER" || m.role === "ADMIN" ? m.team.inviteCode : undefined,
      role: m.role,
      memberCount: m.team._count.members,
      isOwner: m.team.ownerId === session.user.id,
    })),
    ownedCount: owned,
    maxOwned: MAX_OWNED_TEAMS,
    onboardingDone: user?.onboardingDone ?? false,
  });
}

const createSchema = z.object({
  name: z.string().min(2).max(48),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültiger Team-Name" }, { status: 400 });
  }

  const owned = await countOwnedTeams(session.user.id);
  if (owned >= MAX_OWNED_TEAMS) {
    return NextResponse.json(
      { error: `Maximal ${MAX_OWNED_TEAMS} eigene Teams.` },
      { status: 400 }
    );
  }

  const inviteCode = await uniqueInviteCode();

  const team = await prisma.team.create({
    data: {
      name: parsed.data.name.trim(),
      inviteCode,
      ownerId: session.user.id,
      members: {
        create: {
          userId: session.user.id,
          role: "OWNER",
        },
      },
    },
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { onboardingDone: true },
  });

  await logActivity({
    userId: session.user.id,
    action: "team.create",
    detail: `${team.name} (${team.inviteCode})`,
  });

  return NextResponse.json({
    team: {
      id: team.id,
      name: team.name,
      inviteCode: team.inviteCode,
      role: "OWNER",
    },
  });
}
