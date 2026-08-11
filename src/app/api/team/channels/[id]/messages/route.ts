import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getMembership } from "@/lib/teams";
import { z } from "zod";

const postSchema = z.object({
  body: z.string().min(1).max(4000),
});

async function canAccess(userId: string, channelId: string) {
  const channel = await prisma.teamChannel.findUnique({
    where: { id: channelId },
    include: { members: true },
  });
  if (!channel) return null;
  const membership = await getMembership(userId, channel.teamId);
  if (!membership) return null;
  if (membership.role === "OWNER") return channel;
  if (channel.members.some((m) => m.userId === userId)) return channel;
  return null;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const { id } = await params;
  if (!(await canAccess(session.user.id, id))) {
    return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const after = searchParams.get("after");

  const messages = await prisma.teamChannelMessage.findMany({
    where: {
      channelId: id,
      ...(after ? { createdAt: { gt: new Date(after) } } : {}),
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  return NextResponse.json({ messages });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const { id } = await params;
  if (!(await canAccess(session.user.id, id))) {
    return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
  }

  const parsed = postSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Nachricht fehlt" }, { status: 400 });
  }

  const message = await prisma.teamChannelMessage.create({
    data: {
      channelId: id,
      userId: session.user.id,
      body: parsed.data.body.trim(),
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ message });
}
