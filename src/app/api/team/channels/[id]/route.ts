import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getMembership, resolveActiveTeamId } from "@/lib/teams";

async function assertChannelAccess(userId: string, channelId: string) {
  const channel = await prisma.teamChannel.findUnique({
    where: { id: channelId },
    include: { members: true },
  });
  if (!channel) return null;

  const membership = await getMembership(userId, channel.teamId);
  if (!membership) return null;

  const isOwner = membership.role === "OWNER";
  const inChannel = channel.members.some((m) => m.userId === userId);
  if (!isOwner && !inChannel) return null;

  return { channel, membership, isOwner };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const { id } = await params;
  const access = await assertChannelAccess(session.user.id, id);
  if (!access) {
    return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
  }

  const channel = await prisma.teamChannel.findUnique({
    where: { id },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  return NextResponse.json({
    channel,
    isOwner: access.isOwner,
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const { id } = await params;
  const teamId = await resolveActiveTeamId(session.user.id);
  if (!teamId) {
    return NextResponse.json({ error: "Kein Team" }, { status: 400 });
  }

  const me = await getMembership(session.user.id, teamId);
  if (!me || me.role !== "OWNER") {
    return NextResponse.json({ error: "Nur Owner" }, { status: 403 });
  }

  const channel = await prisma.teamChannel.findFirst({
    where: { id, teamId },
  });
  if (!channel) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  await prisma.teamChannel.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
