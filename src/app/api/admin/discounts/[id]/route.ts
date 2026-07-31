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

const patchSchema = z.object({
  percent: z.number().int().min(1).max(100).optional(),
  label: z.string().max(100).optional(),
  maxUses: z.number().int().min(1).nullable().optional(),
  validFrom: z.string().nullable().optional(),
  validUntil: z.string().nullable().optional(),
  active: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  try {
    const body = patchSchema.parse(await req.json());
    const data: any = {};
    if (body.percent !== undefined) data.percent = body.percent;
    if (body.label !== undefined) data.label = body.label;
    if (body.maxUses !== undefined) data.maxUses = body.maxUses;
    if (body.active !== undefined) data.active = body.active;
    if (body.validFrom !== undefined)
      data.validFrom = body.validFrom ? new Date(body.validFrom) : null;
    if (body.validUntil !== undefined)
      data.validUntil = body.validUntil ? new Date(body.validUntil) : null;

    const row = await prisma.discountCode.update({
      where: { id },
      data,
    });
    return NextResponse.json(row);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Fehler" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  await prisma.discountCode.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
