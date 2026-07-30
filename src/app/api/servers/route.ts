import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createLxc, getNextVmid } from "@/lib/proxmox";
import { z } from "zod";
import { randomBytes } from "crypto";

export const maxDuration = 60;

const createSchema = z.object({
  packageId: z.string(),
  hostname: z.string().min(3).max(32).regex(/^[a-z0-9-]+$/),
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
    const { packageId, hostname } = createSchema.parse(body);

    const pkg = await prisma.package.findUnique({ where: { id: packageId } });
    if (!pkg || !pkg.active) {
      return NextResponse.json({ error: "Paket nicht gefunden" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) {
      return NextResponse.json({ error: "User nicht gefunden" }, { status: 404 });
    }

    if (Number(user.balance) < Number(pkg.pricePerHour)) {
      return NextResponse.json(
        { error: "Nicht genug Guthaben. Bitte zuerst aufladen." },
        { status: 400 }
      );
    }

    let vmid: number;
    try {
      vmid = await getNextVmid();
    } catch (e: any) {
      console.error("getNextVmid", e);
      return NextResponse.json(
        { error: e.message || "Proxmox nicht erreichbar" },
        { status: 502 }
      );
    }

    const password = randomBytes(12).toString("base64url");

    const server = await prisma.server.create({
      data: {
        userId: session.user.id,
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
        node: pkg.node,
      });

      await prisma.server.update({
        where: { id: server.id },
        data: { status: "RUNNING" },
      });

      await prisma.$transaction([
        prisma.user.update({
          where: { id: session.user.id },
          data: { balance: { decrement: pkg.pricePerHour } },
        }),
        prisma.transaction.create({
          data: {
            userId: session.user.id,
            type: "PURCHASE",
            amount: -Number(pkg.pricePerHour),
            description: `Server ${hostname} erstellt`,
          },
        }),
      ]);

      return NextResponse.json({
        id: server.id,
        vmid,
        hostname,
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
