import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminRole } from "@/lib/roles";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(5000),
  active: z.boolean().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdminRole((session?.user as any)?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const items = await prisma.platformAnnouncement.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { name: true, email: true } },
    },
    take: 50,
  });

  return NextResponse.json({ announcements: items });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isAdminRole((session.user as any).role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültig" }, { status: 400 });
  }

  const item = await prisma.platformAnnouncement.create({
    data: {
      title: parsed.data.title.trim(),
      body: parsed.data.body.trim(),
      active: parsed.data.active ?? true,
      authorId: session.user.id,
    },
  });

  return NextResponse.json({ announcement: item });
}
