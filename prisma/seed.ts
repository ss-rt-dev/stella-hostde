import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Beispiel-Pakete
  await prisma.package.createMany({
    data: [
      {
        name: "Starter",
        description: "Ideal zum Testen",
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
        description: "Für kleine Projekte",
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
        description: "Mehr Power",
        cpu: 4,
        ramMb: 4096,
        diskGb: 40,
        pricePerHour: 0.12,
        proxmoxTemplateId:
          "local:vztmpl/ubuntu-22.04-standard_22.04-1_amd64.tar.zst",
        node: "pve",
        storage: "local-lvm",
      },
    ],
    skipDuplicates: true,
  });

  // Admin-User (Passwort: admin123456)
  const hash = await bcrypt.hash("admin123456", 12);
  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Admin",
      passwordHash: hash,
      role: "ADMIN",
      balance: 100,
    },
  });

  console.log("Seed fertig.");
  console.log("Admin: admin@example.com / admin123456");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
