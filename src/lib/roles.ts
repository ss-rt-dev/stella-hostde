/** Nutzer-Rollen */
export const ROLES = [
  "CUSTOMER",
  "VIP",
  "SPONSOR",
  "PARTNER",
  "SUPPORTER",
  "MODERATOR",
  "ADMIN",
] as const;

export type AppRole = (typeof ROLES)[number];

export const ROLE_LABELS: Record<AppRole, string> = {
  CUSTOMER: "Kunde",
  VIP: "VIP",
  SPONSOR: "Sponsor",
  PARTNER: "Partner",
  SUPPORTER: "Supporter",
  MODERATOR: "Moderator",
  ADMIN: "Admin",
};

/** Staff mit Admin-Panel-Zugriff (volle Rechte) */
export function isAdminRole(role: string | undefined | null): boolean {
  return role === "ADMIN";
}

/** Staff für Support (Admin, Mod, Supporter) */
export function isStaffRole(role: string | undefined | null): boolean {
  return role === "ADMIN" || role === "MODERATOR" || role === "SUPPORTER";
}

export function roleLabel(role: string): string {
  return ROLE_LABELS[role as AppRole] || role;
}
