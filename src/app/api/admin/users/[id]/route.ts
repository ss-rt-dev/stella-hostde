import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return null;
  }
  if ((session.user as any).impersonatedBy) return null;
  return session;
}

const patchSchema = z.object({
  action: z.enum(["update", "credit", "set_password", "set_role"]),
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).max(100).optional(),
  amount: z.number().optional(),
  description: z.string().optional(),
  role: z.enum(["CUSTOMER", "ADMIN"]).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const data = patchSchema.parse(body);

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ error: "User nicht gefunden" }, { status: 404 });
  }

  try {
    if (data.action === "update") {
      const update: { name?: string; email?: string } = {};
      if (data.name !== undefined) update.name = data.name;
      if (data.email !== undefined) {
        const exists = await prisma.user.findFirst({
          where: { email: data.email, NOT: { id } },
        });
        if (exists) {
          return NextResponse.json({ error: "E-Mail bereits vergeben" }, { status: 400 });
        }
        update.email = data.email;
      }
      const updated = await prisma.user.update({
        where: { id },
        data: update,
      });
      return NextResponse.json({
        id: updated.id,
        name: updated.name,
        email: updated.email,
      });
    }

    if (data.action === "set_password") {
      if (!data.password) {
        return NextResponse.json({ error: "Passwort fehlt" }, { status: 400 });
      }
      const passwordHash = await bcrypt.hash(data.password, 12);
      await prisma.user.update({
        where: { id },
        data: { passwordHash },
      });
      return NextResponse.json({ success: true });
    }

    if (data.action === "set_role") {
      if (!data.role) {
        return NextResponse.json({ error: "Rolle fehlt" }, { status: 400 });
      }
      if (id === session.user.id && data.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Du kannst dir selbst nicht die Admin-Rolle entziehen" },
          { status: 400 }
        );
      }
      const updated = await prisma.user.update({
        where: { id },
        data: { role: data.role },
      });
      return NextResponse.json({ role: updated.role });
    }

    if (data.action === "credit") {
      if (data.amount === undefined || Number.isNaN(data.amount)) {
        return NextResponse.json({ error: "Betrag fehlt" }, { status: 400 });
      }
      const amount = Number(data.amount);
      const updated = await prisma.$transaction(async (tx) => {
        const u = await tx.user.update({
          where: { id },
          data: { balance: { increment: amount } },
        });
        await tx.transaction.create({
          data: {
            userId: id,
            type: amount >= 0 ? "DEPOSIT" : "REFUND",
            amount,
            description:
              data.description ||
              (amount >= 0
                ? `Admin-Gutschrift ${amount} €`
                : `Admin-Abbuchung ${amount} €`),
          },
        });
        return u;
      });
      return NextResponse.json({ balance: Number(updated.balance) });
    }

    return NextResponse.json({ error: "Ungültige Aktion" }, { status: 400 });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message || "Fehler" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  if (id === session.user.id) {
    return NextResponse.json(
      { error: "Du kannst dich nicht selbst löschen" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ error: "User nicht gefunden" }, { status: 404 });
  }

  // Server soft-delete, User hard-delete (Cascade löscht Transaktionen etc.)
  await prisma.server.updateMany({
    where: { userId: id },
    data: { status: "DELETED" },
  });
  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
