/** Nutzer-Rollen inkl. Farben (wie Discord) */

export const SUPER_OWNER_EMAIL = "justin@stella-host.de";

export const ROLES = [
  "CUSTOMER",
  "VIP",
  "SPONSOR",
  "PARTNER",
  "SUPPORTER",
  "MODERATOR",
  "ADMIN",
  "OWNER",
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
  OWNER: "Owner",
};

/** Hex-Farben analog Discord-Rollen */
export const ROLE_COLORS: Record<AppRole, string> = {
  OWNER: "#ff2d55", // pink-rot (Owner)
  ADMIN: "#ef4444", // rot
  MODERATOR: "#22c55e", // grün
  SUPPORTER: "#c026ff", // lila/magenta
  VIP: "#eab308", // gelb/gold
  SPONSOR: "#f97316", // orange/koralle
  PARTNER: "#3b82f6", // blau
  CUSTOMER: "#71717a", // grau
};

/** Rang: niedriger = höher. Justin immer 0 (Platz 1). */
export function roleRank(role: string | undefined | null, email?: string | null): number {
  if ((email || "").toLowerCase().trim() === SUPER_OWNER_EMAIL) return 0;
  switch (role) {
    case "OWNER":
      return 1;
    case "ADMIN":
      return 2;
    case "MODERATOR":
      return 3;
    case "SUPPORTER":
      return 4;
    case "PARTNER":
      return 5;
    case "SPONSOR":
      return 6;
    case "VIP":
      return 7;
    default:
      return 10;
  }
}

export function isSuperOwner(email: string | undefined | null): boolean {
  return (email || "").toLowerCase().trim() === SUPER_OWNER_EMAIL;
}

export function isAdminRole(role: string | undefined | null): boolean {
  return role === "ADMIN" || role === "OWNER";
}

export function isOwnerRole(role: string | undefined | null): boolean {
  return role === "OWNER";
}

export function isStaffRole(role: string | undefined | null): boolean {
  return (
    role === "OWNER" ||
    role === "ADMIN" ||
    role === "MODERATOR" ||
    role === "SUPPORTER"
  );
}

export function roleLabel(role: string): string {
  return ROLE_LABELS[role as AppRole] || role;
}

export function roleColor(role: string): string {
  return ROLE_COLORS[role as AppRole] || ROLE_COLORS.CUSTOMER;
}

/** Sortiert Nutzer: Justin Platz 1, dann Owner, Admin, … */
export function sortByRank<T extends { role: string; email: string }>(users: T[]): T[] {
  return [...users].sort((a, b) => {
    const ra = roleRank(a.role, a.email);
    const rb = roleRank(b.role, b.email);
    if (ra !== rb) return ra - rb;
    return a.email.localeCompare(b.email);
  });
}
