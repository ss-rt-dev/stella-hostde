import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.package.createMany({
    data: [
      {
        name: "Starter",
        description: "Ideal zum Testen",
        cpu: 1,
        ramMb: 1024,
        diskGb: 5,
        pricePerHour: 0.02,
        proxmoxTemplateId:
          "local:vztmpl/ubuntu-22.04-standard_22.04-1_amd64.tar.zst",
        node: "pve",
        storage: "local-lvm",
      },
      {
        name: "Basic",
        description: "Für kleine Projekte",
        cpu: 2,
        ramMb: 2048,
        diskGb: 15,
        pricePerHour: 0.05,
        proxmoxTemplateId:
          "local:vztmpl/ubuntu-22.04-standard_22.04-1_amd64.tar.zst",
        node: "pve",
        storage: "local-lvm",
      },
      {
        name: "Pro",
        description: "Mehr Power",
        cpu: 4,
        ramMb: 4096,
        diskGb: 20,
        pricePerHour: 0.12,
        proxmoxTemplateId:
          "local:vztmpl/ubuntu-22.04-standard_22.04-1_amd64.tar.zst",
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

  console.log("Seed fertig.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
