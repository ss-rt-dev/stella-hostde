/** Nutzer-Rollen inkl. Farben (wie Discord) */
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
  CUSTOMER: "Mitglied",
  VIP: "VIP",
  SPONSOR: "Sponsor",
  PARTNER: "Partner",
  SUPPORTER: "Supporter",
  MODERATOR: "Moderator",
  ADMIN: "Administrator",
};

/** Hex-Farben analog Discord-Rollen */
export const ROLE_COLORS: Record<AppRole, string> = {
  ADMIN: "#ef4444", // rot
  MODERATOR: "#22c55e", // grün
  SUPPORTER: "#c026ff", // lila/magenta
  VIP: "#eab308", // gelb/gold
  SPONSOR: "#f97316", // orange/koralle
  PARTNER: "#3b82f6", // blau
  CUSTOMER: "#71717a", // grau
};

export function isAdminRole(role: string | undefined | null): boolean {
  return role === "ADMIN";
}

export function isStaffRole(role: string | undefined | null): boolean {
  return role === "ADMIN" || role === "MODERATOR" || role === "SUPPORTER";
}

export function roleLabel(role: string): string {
  return ROLE_LABELS[role as AppRole] || role;
}

export function roleColor(role: string): string {
  return ROLE_COLORS[role as AppRole] || ROLE_COLORS.CUSTOMER;
}
