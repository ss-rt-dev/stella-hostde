import { cookies } from "next/headers";
import { prisma } from "./db";
import { randomBytes } from "crypto";

export const MAX_OWNED_TEAMS = 10;
export const TEAM_COOKIE = "stella_team_id";

/** Invite: 4–6 Großbuchstaben + genau 3 Ziffern, z.B. STEL742 */
export function generateInviteCode(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const len = 4 + (randomBytes(1)[0] % 3); // 4–6
  let code = "";
  const buf = randomBytes(len + 3);
  for (let i = 0; i < len; i++) {
    code += letters[buf[i] % letters.length];
  }
  for (let i = 0; i < 3; i++) {
    code += String(buf[len + i] % 10);
  }
  return code;
}

export function normalizeInviteCode(raw: string): string {
  return raw.replace(/\s+/g, "").toUpperCase();
}

export function isValidInviteCodeFormat(code: string): boolean {
  return /^[A-Z]{4,6}\d{3}$/.test(normalizeInviteCode(code));
}

export async function uniqueInviteCode(): Promise<string> {
  for (let i = 0; i < 12; i++) {
    const code = generateInviteCode();
    const exists = await prisma.team.findUnique({ where: { inviteCode: code } });
    if (!exists) return code;
  }
  throw new Error("Konnte keinen Invite-Code erzeugen");
}

export async function getUserMemberships(userId: string) {
  return prisma.teamMember.findMany({
    where: { userId },
    include: {
      team: {
        select: {
          id: true,
          name: true,
          inviteCode: true,
          ownerId: true,
          _count: { select: { members: true } },
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });
}

export async function getMembership(userId: string, teamId: string) {
  return prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
    include: { team: true },
  });
}

export function isTeamStaff(role: string) {
  return role === "OWNER" || role === "ADMIN";
}

/** Aktives Team aus Cookie – nur wenn Mitgliedschaft existiert */
export async function resolveActiveTeamId(userId: string): Promise<string | null> {
  const jar = await cookies();
  const fromCookie = jar.get(TEAM_COOKIE)?.value;
  if (fromCookie) {
    const m = await getMembership(userId, fromCookie);
    if (m) return fromCookie;
  }
  const first = await prisma.teamMember.findFirst({
    where: { userId },
    orderBy: { joinedAt: "asc" },
  });
  return first?.teamId ?? null;
}

export async function countOwnedTeams(userId: string) {
  return prisma.team.count({ where: { ownerId: userId } });
}
