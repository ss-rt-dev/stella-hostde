import { prisma } from "./db";

export async function logActivity(opts: {
  userId: string;
  action: string;
  detail?: string;
  meta?: Record<string, unknown>;
  ip?: string | null;
}) {
  try {
    await prisma.activityLog.create({
      data: {
        userId: opts.userId,
        action: opts.action,
        detail: opts.detail ?? null,
        meta: opts.meta ? JSON.stringify(opts.meta) : null,
        ip: opts.ip ?? null,
      },
    });
  } catch (e) {
    console.error("logActivity", e);
  }
}

export async function recordLogin(userId: string, ip?: string | null) {
  const cleanIp =
    ip && ip !== "unknown" ? ip.slice(0, 64) : null;

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        lastLoginAt: new Date(),
        ...(cleanIp ? { lastLoginIp: cleanIp } : {}),
      },
    });
  } catch (e) {
    console.error("recordLogin", e);
  }

  await logActivity({
    userId,
    action: "login",
    detail: cleanIp ? `Anmeldung von ${cleanIp}` : "Anmeldung",
    ip: cleanIp,
  });
}

/** Nur IP aktualisieren (nach Login, wenn authorize keine Request-IP hatte) */
export async function updateUserIp(userId: string, ip: string | null) {
  const cleanIp =
    ip && ip !== "unknown" ? ip.slice(0, 64) : null;
  if (!cleanIp) return;

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { lastLoginIp: cleanIp },
    });

    // Letzten Login-Activity-Eintrag ohne IP nachziehen
    const lastLogin = await prisma.activityLog.findFirst({
      where: { userId, action: "login" },
      orderBy: { createdAt: "desc" },
    });
    if (lastLogin && !lastLogin.ip) {
      await prisma.activityLog.update({
        where: { id: lastLogin.id },
        data: {
          ip: cleanIp,
          detail: `Anmeldung von ${cleanIp}`,
        },
      });
    }
  } catch (e) {
    console.error("updateUserIp", e);
  }
}

export function actionLabel(action: string): string {
  const map: Record<string, string> = {
    login: "Anmeldung",
    logout: "Abmeldung",
    server_create: "Server erstellt",
    server_start: "Server gestartet",
    server_stop: "Server gestoppt",
    server_delete: "Server gelöscht",
    deposit: "Guthaben aufgeladen",
    password_change: "Passwort geändert",
    profile_update: "Profil aktualisiert",
    admin_credit: "Admin: Guthaben",
    admin_impersonate: "Admin: Login als Nutzer",
    register: "Registrierung",
  };
  return map[action] || action;
}
