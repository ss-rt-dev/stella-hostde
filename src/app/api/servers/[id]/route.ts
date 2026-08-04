import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  startLxc,
  stopLxc,
  deleteLxc,
  resolveNode,
  resizeLxc,
} from "@/lib/proxmox";
import { calcPricePerMonth, clampConfig, PRICING } from "@/lib/pricing";
import { logActivity } from "@/lib/activity";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { action } = body;

  const server = await prisma.server.findFirst({
    where: { id, userId: session.user.id },
    include: { package: true },
  });

  if (!server || !server.proxmoxVmid) {
    return NextResponse.json({ error: "Server nicht gefunden" }, { status: 404 });
  }

  if (server.status === "DELETED") {
    return NextResponse.json({ error: "Server gelöscht" }, { status: 400 });
  }

  try {
    const node = await resolveNode(server.package.node);

    if (action === "start") {
      await startLxc(node, server.proxmoxVmid);
      await prisma.server.update({
        where: { id },
        data: { status: "RUNNING" },
      });
      return NextResponse.json({ success: true });
    }

    if (action === "stop") {
      await stopLxc(node, server.proxmoxVmid);
      await prisma.server.update({
        where: { id },
        data: { status: "STOPPED" },
      });
      return NextResponse.json({ success: true });
    }

    if (action === "resize") {
      const curRam = server.ramMb ?? PRICING.minRamMb;
      const curDisk = server.diskGb ?? PRICING.minDiskGb;
      const curCpu = server.cpu ?? PRICING.minCpu;

      let nextRam = Number(body.ramMb ?? curRam);
      let nextDisk = Number(body.diskGb ?? curDisk);

      const clamped = clampConfig(curCpu, nextRam, nextDisk);
      nextRam = clamped.ramMb;
      nextDisk = clamped.diskGb;

      if (nextRam < curRam) {
        return NextResponse.json(
          { error: "RAM kann nur erhöht werden." },
          { status: 400 }
        );
      }
      if (nextDisk < curDisk) {
        return NextResponse.json(
          { error: "SSD kann nur vergrößert werden." },
          { status: 400 }
        );
      }
      if (nextRam === curRam && nextDisk === curDisk) {
        return NextResponse.json(
          { error: "Keine Änderung gewählt." },
          { status: 400 }
        );
      }

      const oldPrice = calcPricePerMonth(curCpu, curRam, curDisk);
      const newPrice = calcPricePerMonth(curCpu, nextRam, nextDisk);
      const delta = Math.round((newPrice - oldPrice) * 100) / 100;

      if (delta > 0) {
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
        });
        if (!user) {
          return NextResponse.json({ error: "User nicht gefunden" }, { status: 404 });
        }
        if (Number(user.balance) < delta) {
          return NextResponse.json(
            {
              error: `Nicht genug Guthaben für die Erweiterung (+${delta.toFixed(2)} €/Monat).`,
            },
            { status: 400 }
          );
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { balance: { decrement: delta } },
        });
      }

      await resizeLxc({
        node,
        vmid: server.proxmoxVmid,
        memoryMb: nextRam !== curRam ? nextRam : undefined,
        diskGb: nextDisk !== curDisk ? nextDisk : undefined,
      });

      await prisma.server.update({
        where: { id },
        data: {
          ramMb: nextRam,
          diskGb: nextDisk,
          pricePerHour: newPrice,
        },
      });

      await logActivity({
        userId: session.user.id,
        action: "server.resize",
        detail: `${server.name}: RAM ${curRam}→${nextRam} MB, SSD ${curDisk}→${nextDisk} GB, +${delta}€/Monat`,
      });

      return NextResponse.json({
        success: true,
        ramMb: nextRam,
        diskGb: nextDisk,
        pricePerMonth: newPrice,
        extraPerMonth: delta,
      });
    }

    return NextResponse.json({ error: "Ungültige Aktion" }, { status: 400 });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const { id } = await params;

  const server = await prisma.server.findFirst({
    where: { id, userId: session.user.id },
    include: { package: true },
  });

  if (!server || !server.proxmoxVmid) {
    return NextResponse.json({ error: "Server nicht gefunden" }, { status: 404 });
  }

  try {
    const node = await resolveNode(server.package.node);
    await deleteLxc(node, server.proxmoxVmid);
    await prisma.server.update({
      where: { id },
      data: { status: "DELETED" },
    });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
