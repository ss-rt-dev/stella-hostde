import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Server-Templates (Proxmox LXC)
 * Pfade müssen auf dem Proxmox-Node existieren unter local:vztmpl/
 *
 * Empfohlene Templates zum Download auf dem Node:
 *   pveam available
 *   pveam download local ubuntu-22.04-standard_22.04-1_amd64.tar.zst
 *   pveam download local ubuntu-24.04-standard_24.04-2_amd64.tar.zst
 *   pveam download local debian-12-standard_12.7-1_amd64.tar.zst
 *   pveam download local alpine-3.20-default_20240908_amd64.tar.xz
 */
const TEMPLATES = {
  ubuntu22: "local:vztmpl/ubuntu-22.04-standard_22.04-1_amd64.tar.zst",
  ubuntu24: "local:vztmpl/ubuntu-24.04-standard_24.04-2_amd64.tar.zst",
  debian12: "local:vztmpl/debian-12-standard_12.7-1_amd64.tar.zst",
  alpine: "local:vztmpl/alpine-3.20-default_20240908_amd64.tar.xz",
} as const;

async function main() {
  await prisma.package.createMany({
    data: [
      {
        name: "Starter",
        description: "Ideal zum Testen – Ubuntu 22.04",
        cpu: 1,
        ramMb: 1024,
        diskGb: 10,
        pricePerHour: 0.02,
        proxmoxTemplateId: TEMPLATES.ubuntu22,
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
        proxmoxTemplateId: TEMPLATES.ubuntu22,
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
        proxmoxTemplateId: TEMPLATES.ubuntu24,
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
        proxmoxTemplateId: TEMPLATES.debian12,
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
        proxmoxTemplateId: TEMPLATES.alpine,
        node: "pve",
        storage: "local-lvm",
      },
    ],
    skipDuplicates: true,
  });

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

  console.log("Seed fertig. Templates:");
  console.log(Object.entries(TEMPLATES).map(([k, v]) => `  ${k}: ${v}`).join("\n"));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
