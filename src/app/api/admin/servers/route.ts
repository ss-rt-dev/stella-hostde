import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createLxc, getNextVmid, resolveNode } from "@/lib/proxmox";
import { z } from "zod";
import { randomBytes } from "crypto";

export const maxDuration = 60;

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return null;
  }
  return session;
}

const assignSchema = z.object({
  userId: z.string(),
  packageId: z.string(),
  hostname: z.string().min(3).max(32).regex(/^[a-z0-9-]+$/),
  free: z.boolean().optional(),
});

export async function POST(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { userId, packageId, hostname, free } = assignSchema.parse(body);

    const pkg = await prisma.package.findUnique({ where: { id: packageId } });
    if (!pkg || !pkg.active) {
      return NextResponse.json({ error: "Paket nicht gefunden" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User nicht gefunden" }, { status: 404 });
    }

    if (!free && Number(user.balance) < Number(pkg.pricePerHour)) {
      return NextResponse.json(
        { error: "Kunde hat nicht genug Guthaben (oder 'Kostenlos' wählen)" },
        { status: 400 }
      );
    }

    let vmid: number;
    let node: string;
    try {
      node = await resolveNode(pkg.node);
      vmid = await getNextVmid();
    } catch (e: any) {
      console.error("proxmox resolve", e);
      return NextResponse.json(
        { error: e.message || "Proxmox nicht erreichbar" },
        { status: 502 }
      );
    }

    const password = randomBytes(12).toString("base64url");

    const server = await prisma.server.create({
      data: {
        userId,
        packageId: pkg.id,
        name: hostname,
        hostname,
        proxmoxVmid: vmid,
        status: "CREATING",
      },
    });

    try {
      await createLxc({
        vmid,
        hostname,
        password,
        cores: pkg.cpu,
        memory: pkg.ramMb,
        disk: `${pkg.storage}:${pkg.diskGb}`,
        ostemplate: pkg.proxmoxTemplateId,
        node,
      });

      await prisma.server.update({
        where: { id: server.id },
        data: { status: "RUNNING" },
      });

      if (!free) {
        await prisma.$transaction([
          prisma.user.update({
            where: { id: userId },
            data: { balance: { decrement: pkg.pricePerHour } },
          }),
          prisma.transaction.create({
            data: {
              userId,
              type: "PURCHASE",
              amount: -Number(pkg.pricePerHour),
              description: `Admin: Server ${hostname} zugewiesen`,
            },
          }),
        ]);
      } else {
        await prisma.transaction.create({
          data: {
            userId,
            type: "PURCHASE",
            amount: 0,
            description: `Admin: Server ${hostname} kostenlos zugewiesen`,
          },
        });
      }

      return NextResponse.json({
        id: server.id,
        vmid,
        hostname,
        node,
        rootPassword: password,
      });
    } catch (err: any) {
      await prisma.server.update({
        where: { id: server.id },
        data: { status: "ERROR" },
      });
      console.error("createLxc", err);
      return NextResponse.json(
        { error: err.message || "LXC-Erstellung fehlgeschlagen" },
        { status: 502 }
      );
    }
  } catch (e: any) {
    console.error(e);
    if (e?.name === "ZodError") {
      return NextResponse.json(
        { error: "Ungültige Eingabe (Hostname: a-z, 0-9, -, 3–32 Zeichen)" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: e.message || "Serverfehler" },
      { status: 500 }
    );
  }
}
