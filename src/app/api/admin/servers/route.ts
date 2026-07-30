import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createLxc, getNextVmid, resolveNode, resolveStorage } from "@/lib/proxmox";
import { calcPricePerHour, clampConfig, PRICING } from "@/lib/pricing";
import { randomAccessSlug } from "@/lib/slug";
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
  hostname: z.string().min(3).max(32).regex(/^[a-z0-9-]+$/),
  cpu: z.number().int().min(PRICING.minCpu).max(PRICING.maxCpu),
  ramMb: z.number().int().min(PRICING.minRamMb).max(PRICING.maxRamMb),
  diskGb: z.number().int().min(PRICING.minDiskGb).max(PRICING.maxDiskGb),
  free: z.boolean().optional(),
});

export async function POST(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = assignSchema.parse(body);
    const { cpu, ramMb, diskGb } = clampConfig(parsed.cpu, parsed.ramMb, parsed.diskGb);
    const { userId, hostname, free } = parsed;
    const pricePerHour = free ? 0 : calcPricePerHour(cpu, ramMb, diskGb);

    const basePkg = await prisma.package.findFirst({
      where: { active: true },
      orderBy: { createdAt: "asc" },
    });
    if (!basePkg) {
      return NextResponse.json({ error: "Kein Basis-Paket" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User nicht gefunden" }, { status: 404 });
    }

    if (!free && Number(user.balance) < pricePerHour) {
      return NextResponse.json(
        { error: "Kunde hat nicht genug Guthaben (oder 'Kostenlos' wählen)" },
        { status: 400 }
      );
    }

    let vmid: number;
    let node: string;
    let storage: string;
    try {
      node = await resolveNode(basePkg.node);
      storage = await resolveStorage(node, basePkg.storage);
      vmid = await getNextVmid();
    } catch (e: any) {
      return NextResponse.json(
        { error: e.message || "Proxmox nicht erreichbar" },
        { status: 502 }
      );
    }

    const password = randomBytes(12).toString("base64url");
    const accessSlug = randomAccessSlug(16);

    const server = await prisma.server.create({
      data: {
        userId,
        packageId: basePkg.id,
        name: hostname,
        hostname,
        accessSlug,
        proxmoxVmid: vmid,
        status: "CREATING",
        cpu,
        ramMb,
        diskGb,
        pricePerHour,
      },
    });

    try {
      await createLxc({
        vmid,
        hostname,
        password,
        cores: cpu,
        memory: ramMb,
        disk: `${storage}:${diskGb}`,
        ostemplate: basePkg.proxmoxTemplateId,
        node,
      });

      await prisma.server.update({
        where: { id: server.id },
        data: { status: "RUNNING" },
      });

      if (!free && pricePerHour > 0) {
        await prisma.$transaction([
          prisma.user.update({
            where: { id: userId },
            data: { balance: { decrement: pricePerHour } },
          }),
          prisma.transaction.create({
            data: {
              userId,
              type: "PURCHASE",
              amount: -pricePerHour,
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
        accessSlug,
        vmid,
        hostname,
        node,
        storage,
        rootPassword: password,
        consoleUrl: `/server/${accessSlug}/console`,
        filesUrl: `/server/${accessSlug}/files`,
      });
    } catch (err: any) {
      await prisma.server.update({
        where: { id: server.id },
        data: { status: "ERROR" },
      });
      return NextResponse.json(
        { error: err.message || "LXC-Erstellung fehlgeschlagen" },
        { status: 502 }
      );
    }
  } catch (e: any) {
    console.error(e);
    if (e?.name === "ZodError") {
      return NextResponse.json({ error: "Ungültige Eingabe" }, { status: 400 });
    }
    return NextResponse.json(
      { error: e.message || "Serverfehler" },
      { status: 500 }
    );
  }
}
