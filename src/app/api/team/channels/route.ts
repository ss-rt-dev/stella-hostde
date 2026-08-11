import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getMembership, resolveActiveTeamId } from "@/lib/teams";
import { logActivity } from "@/lib/activity";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(60),
  description: z.string().max(300).optional(),
  memberIds: z.array(z.string()).max(100).optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const teamId = await resolveActiveTeamId(session.user.id);
  if (!teamId) {
    return NextResponse.json({ error: "Kein Team" }, { status: 400 });
  }

  const membership = await getMembership(session.user.id, teamId);
  if (!membership) {
    return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
  }

  const isOwner = membership.role === "OWNER";

  // Owner sieht alle Kanäle, andere nur die, in denen sie Mitglied sind
  const channels = await prisma.teamChannel.findMany({
    where: isOwner
      ? { teamId }
      : {
          teamId,
          members: { some: { userId: session.user.id } },
        },
    include: {
      _count: { select: { members: true, messages: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({
    channels: channels.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      isDefault: c.isDefault,
      memberCount: c._count.members,
      messageCount: c._count.messages,
      members: c.members.map((m) => m.user),
    })),
    isOwner,
    teamId,
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const teamId = await resolveActiveTeamId(session.user.id);
  if (!teamId) {
    return NextResponse.json({ error: "Kein Team" }, { status: 400 });
  }

  const membership = await getMembership(session.user.id, teamId);
  if (!membership || membership.role !== "OWNER") {
    return NextResponse.json(
      { error: "Nur der Team-Owner kann Kanäle erstellen" },
      { status: 403 }
    );
  }

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });
  }

  let memberIds = Array.from(new Set(parsed.data.memberIds || []));
  // Owner immer dabei
  if (!memberIds.includes(session.user.id)) {
    memberIds.push(session.user.id);
  }

  for (const uid of memberIds) {
    const m = await getMembership(uid, teamId);
    if (!m) {
      return NextResponse.json(
        { error: "Ein Nutzer ist kein Team-Mitglied" },
        { status: 400 }
      );
    }
  }

  const channel = await prisma.teamChannel.create({
    data: {
      teamId,
      name: parsed.data.name.trim(),
      description: parsed.data.description?.trim() || null,
      createdById: session.user.id,
      members: {
        create: memberIds.map((userId) => ({ userId })),
      },
    },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  await logActivity({
    userId: session.user.id,
    action: "channel.create",
    detail: channel.name,
  });

  return NextResponse.json({
    channel: {
      id: channel.id,
      name: channel.name,
      description: channel.description,
      members: channel.members.map((m) => m.user),
    },
  });
}
