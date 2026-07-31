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
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  } catch (e) {
    console.error("recordLogin lastLoginAt", e);
  }
  await logActivity({
    userId,
    action: "login",
    detail: "Anmeldung",
    ip,
  });
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
