import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createLxc, getNextVmid, resolveNode } from "@/lib/proxmox";
import { calcPricePerHour, clampConfig } from "@/lib/pricing";
import { z } from "zod";
import { randomBytes } from "crypto";

export const maxDuration = 60;

const createSchema = z.object({
  hostname: z.string().min(3).max(32).regex(/^[a-z0-9-]+$/),
  cpu: z.number().int().min(1).max(16),
  ramMb: z.number().int().min(512).max(32768),
  diskGb: z.number().int().min(10).max(500),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const servers = await prisma.server.findMany({
    where: {
      userId: session.user.id,
      status: { not: "DELETED" },
    },
    include: { package: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(servers);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createSchema.parse(body);
    const { cpu, ramMb, diskGb } = clampConfig(parsed.cpu, parsed.ramMb, parsed.diskGb);
    const hostname = parsed.hostname;
    const pricePerHour = calcPricePerHour(cpu, ramMb, diskGb);

    const basePkg = await prisma.package.findFirst({
      where: { active: true },
      orderBy: { createdAt: "asc" },
    });
    if (!basePkg) {
      return NextResponse.json(
        { error: "Kein Basis-Paket (Debian 11) – bitte Seed ausführen" },
        { status: 404 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) {
      return NextResponse.json({ error: "User nicht gefunden" }, { status: 404 });
    }

    if (Number(user.balance) < pricePerHour) {
      return NextResponse.json(
        { error: "Nicht genug Guthaben für die erste Stunde." },
        { status: 400 }
      );
    }

    let vmid: number;
    let node: string;
    try {
      node = await resolveNode(basePkg.node);
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
        userId: session.user.id,
        packageId: basePkg.id,
        name: hostname,
        hostname,
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
        disk: `${basePkg.storage}:${diskGb}`,
        ostemplate: basePkg.proxmoxTemplateId,
        node,
      });

      await prisma.server.update({
        where: { id: server.id },
        data: { status: "RUNNING" },
      });

      await prisma.$transaction([
        prisma.user.update({
          where: { id: session.user.id },
          data: { balance: { decrement: pricePerHour } },
        }),
        prisma.transaction.create({
          data: {
            userId: session.user.id,
            type: "PURCHASE",
            amount: -pricePerHour,
            description: `Server ${hostname} (${cpu}vCPU/${ramMb}MB/${diskGb}GB)`,
          },
        }),
      ]);

      return NextResponse.json({
        id: server.id,
        vmid,
        hostname,
        node,
        cpu,
        ramMb,
        diskGb,
        pricePerHour,
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
        { error: "Ungültige Eingabe – prüfe Hostname und Ressourcen" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: e.message || "Serverfehler" },
      { status: 500 }
    );
  }
}
