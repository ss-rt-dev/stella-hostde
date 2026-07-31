import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Storage wird zur Laufzeit per Proxmox-API gewählt – hier nur Platzhalter.
 * Template muss existieren, z.B.:
 *   pveam download local debian-11-standard_11.7-1_amd64.tar.zst
 */
const BASE_PACKAGE = {
  name: "Debian 11",
  description: "Konfigurierbarer Server – Debian 11",
  cpu: 1,
  ramMb: 1024,
  diskGb: 10,
  pricePerHour: 0.02,
  proxmoxTemplateId: "local:vztmpl/debian-11-standard_11.7-1_amd64.tar.zst",
  node: "pve",
  storage: "auto",
};

async function main() {
  // Alle alten local-lvm Pakete bereinigen
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
