import { prisma } from "@/lib/db";
import { isStaffRole } from "@/lib/roles";
import { randomAccessSlug } from "@/lib/slug";

/** Server per accessSlug oder interner id laden + Zugriff prüfen */
export async function getServerForUser(
  slugOrId: string,
  sessionUser: { id: string; role?: string }
) {
  let server = await prisma.server.findFirst({
    where: {
      status: { not: "DELETED" },
      OR: [{ accessSlug: slugOrId }, { id: slugOrId }],
    },
    include: { package: true },
  });

  if (!server) {
    return { error: "Server nicht gefunden", status: 404 as const };
  }

  // Fehlenden accessSlug nachtragen (alte Server)
  if (!server.accessSlug) {
    let slug = randomAccessSlug(16);
    for (let i = 0; i < 5; i++) {
      try {
        server = await prisma.server.update({
          where: { id: server.id },
          data: { accessSlug: slug },
          include: { package: true },
        });
        break;
      } catch {
        slug = randomAccessSlug(16);
      }
    }
  }

  const isOwner = server.userId === sessionUser.id;
  const staff = isStaffRole(sessionUser.role);
  if (!isOwner && !staff) {
    return { error: "Kein Zugriff", status: 403 as const };
  }

  return { server };
}
