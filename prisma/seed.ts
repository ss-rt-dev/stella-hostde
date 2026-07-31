import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

/**
 * Storage wird zur Laufzeit per Proxmox-API gewählt – hier nur Platzhalter "auto".
 * Template muss auf Proxmox existieren, z.B.:
 *   pveam download local debian-11-standard_11.7-1_amd64.tar.zst
 */
const BASE_PACKAGE = {
  name: "Debian 11",
  description: "Konfigurierbarer LXC – Debian 11",
  cpu: 1,
  ramMb: 1024,
  diskGb: 10,
  pricePerHour: 0.02,
  proxmoxTemplateId: "local:vztmpl/debian-11-standard_11.7-1_amd64.tar.zst",
  node: "pve",
  storage: "auto",
};

async function main() {
  // Alte local-lvm Einträge bereinigen
  await prisma.package.updateMany({
    data: { storage: "auto" },
  });

  await prisma.package.updateMany({
    where: { name: { not: BASE_PACKAGE.name } },
    data: { active: false },
  });

  const existing = await prisma.package.findFirst({
    where: { name: BASE_PACKAGE.name },
  });

  if (existing) {
    await prisma.package.update({
      where: { id: existing.id },
      data: { ...BASE_PACKAGE, active: true },
    });
    console.log("  ↻ Basis-Paket Debian 11 aktualisiert");
  } else {
    await prisma.package.create({ data: { ...BASE_PACKAGE, active: true } });
    console.log("  ✓ Basis-Paket Debian 11 angelegt");
  }

  // Fehlende accessSlug bei alten Servern nachziehen
  const withoutSlug = await prisma.server.findMany({
    where: { OR: [{ accessSlug: null }, { accessSlug: "" }] },
    select: { id: true },
  });
  for (const s of withoutSlug) {
    const slug = randomBytes(12).toString("base64url");
    await prisma.server.update({
      where: { id: s.id },
      data: { accessSlug: slug },
    });
  }
  if (withoutSlug.length) {
    console.log(`  ✓ ${withoutSlug.length} Server mit accessSlug befüllt`);
  }

  const hash = await bcrypt.hash("Jopo23%?06", 12);
  await prisma.user.upsert({
    where: { email: "justin@stella-host.de" },
    update: { passwordHash: hash, role: "ADMIN" },
    create: {
      email: "justin@stella-host.de",
      name: "Justin | Owner",
      passwordHash: hash,
      role: "ADMIN",
      balance: 100000,
    },
  });
  console.log("  ✓ Admin-User justin@stella-host.de");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
