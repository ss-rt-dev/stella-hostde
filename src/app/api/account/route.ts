import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deleteLxc, resolveNode, stopLxc } from "@/lib/proxmox";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  password: z.string().min(1),
  confirm: z.literal("LÖSCHEN"),
});

/**
 * Konto vollständig löschen (DSGVO Art. 17).
 * Löscht Server auf Proxmox (best effort) und alle DB-Daten des Users.
 */
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  // Impersonation: Admin soll nicht versehentlich den User löschen
  if ((session.user as any).impersonatedBy) {
    return NextResponse.json(
      { error: "Während Impersonation nicht möglich" },
      { status: 403 }
    );
  }

  try {
    const body = schema.parse(await req.json());
    const userId = session.user.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User nicht gefunden" }, { status: 404 });
    }

    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Passwort ist falsch" },
        { status: 400 }
      );
    }

    // Proxmox-Container stoppen & löschen (Fehler nicht blockierend)
    const servers = await prisma.server.findMany({
      where: {
        userId,
        status: { not: "DELETED" },
        proxmoxVmid: { not: null },
      },
      include: { package: true },
    });

    for (const s of servers) {
      if (!s.proxmoxVmid) continue;
      try {
        const node = await resolveNode(s.package.node);
        try {
          await stopLxc(node, s.proxmoxVmid);
        } catch {
          /* already stopped */
        }
        await deleteLxc(node, s.proxmoxVmid);
      } catch (e) {
        console.error(`delete LXC ${s.proxmoxVmid}`, e);
      }
    }

    // Alle zugehörigen Daten (Cascade im Schema: tickets, messages, servers, …)
    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e?.name === "ZodError") {
      return NextResponse.json(
        {
          error:
            "Zur Bestätigung Passwort eingeben und LÖSCHEN in Großbuchstaben tippen",
        },
        { status: 400 }
      );
    }
    console.error(e);
    return NextResponse.json(
      { error: e.message || "Löschen fehlgeschlagen" },
      { status: 500 }
    );
  }
}
