import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { actionLabel } from "@/lib/activity";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return null;
  }
  if ((session.user as any).impersonatedBy) return null;
  return session;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      servers: {
        where: { status: { not: "DELETED" } },
        include: { package: true },
      },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 30,
      },
      _count: { select: { transactions: true, activities: true } },
    },
  });

  return NextResponse.json(
    users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      balance: Number(u.balance),
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt,
      servers: u.servers,
      transactionCount: u._count.transactions,
      activityCount: u._count.activities,
      activities: u.activities.map((a) => ({
        id: a.id,
        action: a.action,
        label: actionLabel(a.action),
        detail: a.detail,
        ip: a.ip,
        createdAt: a.createdAt,
      })),
    }))
  );
}

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  password: z.string().min(6).max(100),
  role: z.enum(["CUSTOMER", "ADMIN"]).optional(),
  balance: z.number().min(0).optional(),
});

export async function POST(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = createSchema.parse(await req.json());
    const exists = await prisma.user.findUnique({ where: { email: body.email } });
    if (exists) {
      return NextResponse.json({ error: "E-Mail bereits vergeben" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name,
        passwordHash,
        role: body.role || "CUSTOMER",
        balance: body.balance ?? 0,
      },
    });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      balance: Number(user.balance),
    });
  } catch (e: any) {
    if (e?.name === "ZodError") {
      return NextResponse.json({ error: "Ungültige Eingabe" }, { status: 400 });
    }
    return NextResponse.json({ error: e.message || "Fehler" }, { status: 500 });
  }
}
