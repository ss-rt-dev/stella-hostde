import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Proxmox LXC Templates – müssen auf dem Node existieren:
 *   pveam download local ubuntu-22.04-standard_22.04-1_amd64.tar.zst
 *   pveam download local ubuntu-24.04-standard_24.04-2_amd64.tar.zst
 *   pveam download local debian-12-standard_12.7-1_amd64.tar.zst
 *   pveam download local alpine-3.20-default_20240908_amd64.tar.xz
 */
const PACKAGES = [
  {
    name: "Starter",
    description: "Ideal zum Testen – Ubuntu 22.04",
    cpu: 1,
    ramMb: 1024,
    diskGb: 10,
    pricePerHour: 0.02,
    proxmoxTemplateId:
      "local:vztmpl/ubuntu-22.04-standard_22.04-1_amd64.tar.zst",
    node: "pve",
    storage: "local-lvm",
  },
  {
    name: "Basic",
    description: "Für kleine Projekte – Ubuntu 22.04",
    cpu: 2,
    ramMb: 2048,
    diskGb: 20,
    pricePerHour: 0.05,
    proxmoxTemplateId:
      "local:vztmpl/ubuntu-22.04-standard_22.04-1_amd64.tar.zst",
    node: "pve",
    storage: "local-lvm",
  },
  {
    name: "Pro",
    description: "Mehr Power – Ubuntu 24.04 LTS",
    cpu: 4,
    ramMb: 4096,
    diskGb: 40,
    pricePerHour: 0.12,
    proxmoxTemplateId:
      "local:vztmpl/ubuntu-24.04-standard_24.04-2_amd64.tar.zst",
    node: "pve",
    storage: "local-lvm",
  },
  {
    name: "Business",
    description: "Für produktive Workloads – Debian 12",
    cpu: 6,
    ramMb: 8192,
    diskGb: 80,
    pricePerHour: 0.25,
    proxmoxTemplateId: "local:vztmpl/debian-12-standard_12.7-1_amd64.tar.zst",
    node: "pve",
    storage: "local-lvm",
  },
  {
    name: "Alpine Lite",
    description: "Minimal & sparsam – Alpine Linux",
    cpu: 1,
    ramMb: 512,
    diskGb: 5,
    pricePerHour: 0.01,
    proxmoxTemplateId:
      "local:vztmpl/alpine-3.20-default_20240908_amd64.tar.xz",
    node: "pve",
    storage: "local-lvm",
  },
] as const;

async function main() {
  // Pakete per Name upserten (eintragen / aktualisieren)
  for (const pkg of PACKAGES) {
    const existing = await prisma.package.findFirst({
      where: { name: pkg.name },
    });
    if (existing) {
      await prisma.package.update({
        where: { id: existing.id },
        data: {
          description: pkg.description,
          cpu: pkg.cpu,
          ramMb: pkg.ramMb,
          diskGb: pkg.diskGb,
          pricePerHour: pkg.pricePerHour,
          proxmoxTemplateId: pkg.proxmoxTemplateId,
          node: pkg.node,
          storage: pkg.storage,
          active: true,
        },
      });
      console.log(`  ↻ Paket aktualisiert: ${pkg.name}`);
    } else {
      await prisma.package.create({ data: { ...pkg } });
      console.log(`  ✓ Paket angelegt: ${pkg.name}`);
    }
  }

  const hash = await bcrypt.hash("Jopo23%?06", 12);
  await prisma.user.upsert({
    where: { email: "justin@stella-host.de" },
    update: {
      passwordHash: hash,
      role: "ADMIN",
    },
    create: {
      email: "justin@stella-host.de",
      name: "Justin | Owner",
      passwordHash: hash,
      role: "ADMIN",
      balance: 100000,
    },
  });
  console.log("  ✓ Admin-User justin@stella-host.de");

  const pkgCount = await prisma.package.count();
  console.log(`\nSeed fertig. ${pkgCount} Pakete in der DB.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
