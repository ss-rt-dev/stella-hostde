import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** Aktive Platform-Ankündigungen fürs User-Dashboard */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const announcements = await prisma.platformAnnouncement.findMany({
    where: { active: true },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      title: true,
      body: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ announcements });
}
