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
          error: `Nicht genug Guthaben (${pricePerMonth.toFixed(2)} €${
            percent ? `, ${percent}% Rabatt` : ""
          }).`,
        },
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
      console.error("proxmox resolve", e);
      return NextResponse.json(
        { error: e.message || "Proxmox nicht erreichbar" },
        { status: 502 }
      );
    }

    const password = randomBytes(12).toString("base64url");
    const accessSlug = randomAccessSlug(16);

    const server = await prisma.server.create({
      data: {
        userId: session.user.id,
        packageId: basePkg.id,
        name: hostname,
        hostname,
        accessSlug,
        proxmoxVmid: vmid,
        status: "CREATING",
        cpu,
        ramMb,
        diskGb,
        pricePerHour: pricePerMonth,
        serverType,
        softwareVariant,
        softwareVersion: parsed.softwareVersion || null,
        discountCode: appliedCode,
        setupStatus: serverType === "DEBIAN" ? "skipped" : "pending",
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

      let setupStatus = "skipped";
      let setupNote: string | null = null;

      if (serverType !== "DEBIAN" && softwareVariant) {
        try {
          await new Promise((r) => setTimeout(r, 8000));
          const setup = await runSoftwareSetup({
            vmid,
            kind: serverType,
            variant: softwareVariant,
            version: parsed.softwareVersion,
          });
          setupStatus = setup.status;
          setupNote = setup.note;
        } catch (e: any) {
          setupStatus = "failed";
          setupNote = e.message || "Setup fehlgeschlagen";
        }
      }

      await prisma.server.update({
        where: { id: server.id },
        data: {
          status: "RUNNING",
          setupStatus,
          setupNote,
        },
      });

      const descParts = [
        `Monatsgebühr ${hostname}`,
        serverType !== "DEBIAN" ? serverType : null,
        softwareVariant,
        percent ? `Rabatt ${appliedCode} -${percent}%` : null,
        `${cpu}vCPU/${ramMb}MB/${diskGb}GB`,
      ].filter(Boolean);

      await prisma.$transaction([
        prisma.user.update({
          where: { id: session.user.id },
          data: { balance: { decrement: pricePerMonth } },
        }),
        prisma.transaction.create({
          data: {
            userId: session.user.id,
            type: "PURCHASE",
            amount: -pricePerMonth,
            description: descParts.join(" · "),
          },
        }),
      ]);

      await incrementDiscountUse(appliedCode);
      await logActivity({
        userId: session.user.id,
        action: "server_create",
        detail: `${hostname} · ${cpu}vCPU / ${ramMb}MB / ${diskGb}GB · ${pricePerMonth.toFixed(2)} €`,
        meta: { vmid, accessSlug, discount: appliedCode },
      });

      return NextResponse.json({
        id: server.id,
        accessSlug,
        vmid,
        hostname,
        node,
        storage,
        cpu,
        ramMb,
        diskGb,
        pricePerMonth,
        basePrice,
        discountPercent: percent,
        discountCode: appliedCode,
        serverType,
        softwareVariant,
        setupStatus,
        setupNote,
        rootPassword: password,
        consoleUrl: `/server/${accessSlug}/console`,
        filesUrl: `/server/${accessSlug}/files`,
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
        { error: "Ungültige Eingabe – prüfe Hostname und Optionen" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: e.message || "Serverfehler" },
      { status: 500 }
    );
  }
}
