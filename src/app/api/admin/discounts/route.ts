import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") return null;
  if ((session.user as any).impersonatedBy) return null;
  return session;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const list = await prisma.discountCode.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(list);
}

const createSchema = z.object({
  code: z.string().min(2).max(32),
  percent: z.number().int().min(1).max(100),
  label: z.string().max(100).optional(),
  maxUses: z.number().int().min(1).nullable().optional(),
  validFrom: z.string().nullable().optional(),
  validUntil: z.string().nullable().optional(),
  active: z.boolean().optional(),
});

export async function POST(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const body = createSchema.parse(await req.json());
    const code = body.code.trim().toUpperCase();
    const row = await prisma.discountCode.create({
      data: {
        code,
        percent: body.percent,
        label: body.label || `${body.percent} % Rabatt`,
        maxUses: body.maxUses ?? null,
        validFrom: body.validFrom ? new Date(body.validFrom) : null,
        validUntil: body.validUntil ? new Date(body.validUntil) : null,
        active: body.active !== false,
      },
    });
    return NextResponse.json(row);
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "Code existiert bereits" }, { status: 400 });
    }
    if (e?.name === "ZodError") {
      return NextResponse.json({ error: "Ungültige Eingabe" }, { status: 400 });
    }
    return NextResponse.json({ error: e.message || "Fehler" }, { status: 500 });
  }
}
