import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isStaffRole } from "@/lib/roles";
import { z } from "zod";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const items = await prisma.teamAnnouncement.findMany({
    include: {
      author: { select: { id: true, name: true, email: true } },
    },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    take: 30,
  });

  return NextResponse.json({ announcements: items });
}

const createSchema = z.object({
  title: z.string().min(1).max(150),
  body: z.string().min(1).max(5000),
  pinned: z.boolean().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }
  if (!isStaffRole((session.user as any).role)) {
    return NextResponse.json({ error: "Nur Team" }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });
  }

  const item = await prisma.teamAnnouncement.create({
    data: {
      title: parsed.data.title,
      body: parsed.data.body,
      pinned: parsed.data.pinned ?? false,
      authorId: session.user.id,
    },
    include: {
      author: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ announcement: item });
}
