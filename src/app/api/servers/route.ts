import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  createLxc,
  getNextVmid,
  resolveNode,
  resolveStorage,
} from "@/lib/proxmox";
import { calcPricePerMonth, clampConfig, PRICING } from "@/lib/pricing";
import { applyDiscount, incrementDiscountUse } from "@/lib/discounts";
import {
  runSoftwareSetup,
  type ServerKind,
} from "@/lib/software-setup";
import { randomAccessSlug } from "@/lib/slug";
import { logActivity } from "@/lib/activity";
import { z } from "zod";
import { randomBytes } from "crypto";

export const maxDuration = 60;

const createSchema = z.object({
  hostname: z.string().min(3).max(32).regex(/^[a-z0-9-]+$/),
  cpu: z.number().int().min(PRICING.minCpu).max(PRICING.maxCpu),
  ramMb: z.number().int().min(PRICING.minRamMb).max(PRICING.maxRamMb),
  diskGb: z.number().int().min(PRICING.minDiskGb).max(PRICING.maxDiskGb),
  serverType: z.enum(["DEBIAN", "MINECRAFT", "DISCORD_BOT"]).default("DEBIAN"),
  softwareVariant: z.string().optional(),
  softwareVersion: z.string().optional(),
  discountCode: z.string().max(32).optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  let servers = await prisma.server.findMany({
    where: {
      userId: session.user.id,
      status: { not: "DELETED" },
    },
    include: { package: true },
    orderBy: { createdAt: "desc" },
  });

  // Alte Server ohne accessSlug nachrüsten
  for (const s of servers) {
    if (!s.accessSlug) {
      try {
        const updated = await prisma.server.update({
          where: { id: s.id },
          data: { accessSlug: randomAccessSlug(16) },
          include: { package: true },
        });
        Object.assign(s, updated);
      } catch {
        /* unique race – ignore */
      }
    }
  }

  servers = await prisma.server.findMany({
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
    const { cpu, ramMb, diskGb } = clampConfig(
      parsed.cpu,
      parsed.ramMb,
      parsed.diskGb
    );
    const hostname = parsed.hostname;
    const serverType = parsed.serverType as ServerKind;

    let softwareVariant = parsed.softwareVariant || null;
    if (serverType === "MINECRAFT" && !softwareVariant) softwareVariant = "paper";
    if (serverType === "DISCORD_BOT" && !softwareVariant) softwareVariant = "python";
    if (serverType === "DEBIAN") softwareVariant = null;

    const basePrice = calcPricePerMonth(cpu, ramMb, diskGb);
    const { price: pricePerMonth, percent, code: appliedCode } = await applyDiscount(
      basePrice,
      parsed.discountCode
    );

    if (parsed.discountCode?.trim() && !appliedCode) {
      return NextResponse.json(
        { error: "Ungültiger Rabattcode" },
        { status: 400 }
      );
    }

    const basePkg = await prisma.package.findFirst({
      where: { active: true },
      orderBy: { createdAt: "asc" },
    });
    if (!basePkg) {
      return NextResponse.json(
        { error: "Kein Basis-Paket – bitte Seed ausführen" },
        { status: 404 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    if (!user) {
      return NextResponse.json({ error: "User nicht gefunden" }, { status: 404 });
    }

    if (Number(user.balance) < pricePerMonth) {
      return NextResponse.json(
        {
          error: `Nicht genug Guthaben (benötigt ${pricePerMonth.toFixed(2)} € für den ersten Monat)`,
        },
        { status: 400 }
      );
    }

    const node = await resolveNode(basePkg.node);
    const storage = await resolveStorage(node, basePkg.storage);
    const vmid = await getNextVmid();
    const password = randomBytes(12).toString("base64url").slice(0, 16);
    const accessSlug = randomAccessSlug(16);

    await createLxc({
      node,
      vmid,
      hostname,
      password,
      cores: cpu,
      memory: ramMb,
      disk: diskGb,
      storage,
      ostemplate: basePkg.proxmoxTemplateId,
    });

    // Start im Hintergrund – createLxc startet oft schon
    try {
      const { startLxc } = await import("@/lib/proxmox");
      await startLxc(node, vmid);
    } catch (e) {
      console.warn("start after create", e);
    }

    const pricePerHour = pricePerMonth / (30 * 24);

    const server = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { balance: { decrement: pricePerMonth } },
      });
      await tx.transaction.create({
        data: {
          userId: user.id,
          type: "PURCHASE",
          amount: -pricePerMonth,
          description: `Server ${hostname} (1. Monat${appliedCode ? `, ${percent}% Rabatt` : ""})`,
        },
      });
      return tx.server.create({
        data: {
          accessSlug,
          userId: user.id,
          packageId: basePkg.id,
          proxmoxVmid: vmid,
          name: hostname,
          hostname,
          status: "RUNNING",
          cpu,
          ramMb,
          diskGb,
          pricePerHour,
          serverType,
          softwareVariant,
          softwareVersion: parsed.softwareVersion || null,
          discountCode: appliedCode,
          lastBilledAt: new Date(),
        },
      });
    });

    if (appliedCode) {
      await incrementDiscountUse(appliedCode);
    }

    // Software-Setup async (nicht blockierend für Response)
    void runSoftwareSetup({
      vmid,
      serverType,
      softwareVariant,
      softwareVersion: parsed.softwareVersion,
    }).then(async (result) => {
      if (result) {
        await prisma.server.update({
          where: { id: server.id },
          data: {
            setupStatus: result.ok ? "OK" : "ERROR",
            setupNote: result.note || null,
          },
        });
      }
    });

    await logActivity({
      userId: user.id,
      action: "server_create",
      detail: `Server ${hostname} erstellt`,
      meta: { vmid, accessSlug, discount: appliedCode },
    });

    return NextResponse.json({
      id: server.id,
      accessSlug,
      name: hostname,
      status: "RUNNING",
      proxmoxVmid: vmid,
      rootPassword: password,
      consoleUrl: `/server/${accessSlug}/console`,
      filesUrl: `/server/${accessSlug}/files`,
    });
  } catch (e: any) {
    console.error("create server", e);
    if (e?.name === "ZodError") {
      return NextResponse.json({ error: "Ungültige Eingabe" }, { status: 400 });
    }
    return NextResponse.json(
      { error: e.message || "Server konnte nicht erstellt werden" },
      { status: 500 }
    );
  }
}
