import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getMembership } from "@/lib/teams";
import { z } from "zod";

const schema = z.object({
  userId: z.string().min(1),
  action: z.enum(["add", "remove"]).default("add"),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const { id } = await params;
  const channel = await prisma.teamChannel.findUnique({ where: { id } });
  if (!channel) {
    return NextResponse.json({ error: "Kanal nicht gefunden" }, { status: 404 });
  }

  const me = await getMembership(session.user.id, channel.teamId);
  if (!me || me.role !== "OWNER") {
    return NextResponse.json(
      { error: "Nur der Owner kann Mitglieder hinzufügen" },
      { status: 403 }
    );
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültig" }, { status: 400 });
  }

  const { userId, action } = parsed.data;
  const target = await getMembership(userId, channel.teamId);
  if (!target) {
    return NextResponse.json(
      { error: "Nutzer ist kein Team-Mitglied" },
      { status: 400 }
    );
  }

  if (action === "remove") {
    await prisma.teamChannelMember.deleteMany({
      where: { channelId: id, userId },
    });
  } else {
    await prisma.teamChannelMember.upsert({
      where: { channelId_userId: { channelId: id, userId } },
      create: { channelId: id, userId },
      update: {},
    });
  }

  const members = await prisma.teamChannelMember.findMany({
    where: { channelId: id },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json({
    members: members.map((m) => m.user),
  });
}
