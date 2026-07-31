import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, createImpersonateToken } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  userId: z.string().min(1),
});

/** Admin startet Session als anderer Nutzer */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Während Impersonation darf man nicht nochmal impersonieren
  if ((session.user as any).impersonatedBy) {
    return NextResponse.json(
      { error: "Beende zuerst die aktuelle Nutzer-Ansicht" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const { userId } = schema.parse(body);

  if (userId === session.user.id) {
    return NextResponse.json({ error: "Das bist du bereits" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) {
    return NextResponse.json({ error: "User nicht gefunden" }, { status: 404 });
  }

  const token = createImpersonateToken(session.user.id, userId);
  return NextResponse.json({
    token,
    user: { id: target.id, email: target.email, name: target.name },
  });
}
