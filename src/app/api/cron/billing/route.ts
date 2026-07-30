import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { stopLxc, resolveNode } from "@/lib/proxmox";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const runningServers = await prisma.server.findMany({
    where: { status: "RUNNING" },
    include: { package: true, user: true },
  });

  let charged = 0;
  let stopped = 0;

  for (const server of runningServers) {
    const hoursSinceLastBill =
      (Date.now() - server.lastBilledAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceLastBill < 0.95) continue;

    const price =
      server.pricePerHour != null
        ? Number(server.pricePerHour)
        : Number(server.package.pricePerHour);
    const balance = Number(server.user.balance);

    if (balance >= price) {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: server.userId },
          data: { balance: { decrement: price } },
        }),
        prisma.transaction.create({
          data: {
            userId: server.userId,
            type: "HOURLY_CHARGE",
            amount: -price,
            description: `Stündliche Gebühr Server ${server.name}`,
          },
        }),
        prisma.server.update({
          where: { id: server.id },
          data: { lastBilledAt: new Date() },
        }),
      ]);
      charged++;
    } else {
      try {
        if (server.proxmoxVmid) {
          const node = await resolveNode(server.package.node);
          await stopLxc(node, server.proxmoxVmid);
        }
        await prisma.server.update({
          where: { id: server.id },
          data: { status: "STOPPED" },
        });
        stopped++;
      } catch (e) {
        console.error(`Stop fehlgeschlagen für ${server.id}`, e);
      }
    }
  }

  return NextResponse.json({ charged, stopped });
}
