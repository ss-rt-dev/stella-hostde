import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAdminRole } from "@/lib/roles";
import { uniqueInviteCode } from "@/lib/teams";
import { z } from "zod";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isAdminRole((session.user as any).role)) return null;
  if ((session.user as any).impersonatedBy) return null;
  return session;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const teams = await prisma.team.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      _count: {
        select: { members: true, todos: true, announcements: true },
      },
    },
  });

  return NextResponse.json(teams);
}

const createSchema = z.object({
  name: z.string().min(2).max(48),
  ownerEmail: z.string().email().optional(),
  ownerId: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = createSchema.parse(await req.json());

    let ownerId = body.ownerId;
    if (!ownerId && body.ownerEmail) {
      const u = await prisma.user.findUnique({
        where: { email: body.ownerEmail.toLowerCase().trim() },
      });
      if (!u) {
        return NextResponse.json(
          { error: "Owner-E-Mail nicht gefunden" },
          { status: 404 }
        );
      }
      ownerId = u.id;
    }
    if (!ownerId) {
      // Fallback: Platform-Admin als Owner
      ownerId = session.user.id;
    }

    const inviteCode = await uniqueInviteCode();
    const team = await prisma.team.create({
      data: {
        name: body.name.trim(),
        inviteCode,
        ownerId,
        members: {
          create: {
            userId: ownerId,
            role: "OWNER",
          },
        },
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ team });
  } catch (e: any) {
    if (e?.name === "ZodError") {
      return NextResponse.json({ error: "Ungültige Eingabe" }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: e.message || "Fehler" }, { status: 500 });
  }
}
