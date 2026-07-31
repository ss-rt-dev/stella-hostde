import { prisma } from "./db";

export type DiscountResult = {
  price: number;
  percent: number;
  code: string | null;
};

/** Fallback falls DB noch leer */
const FALLBACK: Record<string, { percent: number; label: string }> = {
  "NEXUS-10": { percent: 10, label: "10 % Rabatt" },
};

export async function findActiveDiscount(code: string | null | undefined) {
  if (!code?.trim()) return null;
  const key = code.trim().toUpperCase();

  try {
    const row = await prisma.discountCode.findUnique({ where: { code: key } });
    if (row) {
      if (!row.active) return null;
      const now = new Date();
      if (row.validFrom && now < row.validFrom) return null;
      if (row.validUntil && now > row.validUntil) return null;
      if (row.maxUses != null && row.usedCount >= row.maxUses) return null;
      return {
        code: row.code,
        percent: row.percent,
        label: row.label || `${row.percent} % Rabatt`,
        id: row.id,
      };
    }
  } catch {
    /* schema ggf. noch nicht gepusht */
  }

  const fb = FALLBACK[key];
  if (!fb) return null;
  return { code: key, percent: fb.percent, label: fb.label, id: null as string | null };
}

export function applyDiscountSync(
  price: number,
  percent: number
): number {
  return Math.round(price * (1 - percent / 100) * 100) / 100;
}

export async function applyDiscount(
  price: number,
  code: string | null | undefined
): Promise<DiscountResult> {
  const found = await findActiveDiscount(code);
  if (!found) return { price, percent: 0, code: null };
  return {
    price: applyDiscountSync(price, found.percent),
    percent: found.percent,
    code: found.code,
  };
}

export async function incrementDiscountUse(code: string | null) {
  if (!code) return;
  try {
    await prisma.discountCode.updateMany({
      where: { code: code.toUpperCase() },
      data: { usedCount: { increment: 1 } },
    });
  } catch {
    /* ignore */
  }
}

export async function validateDiscountCode(code: string | null | undefined) {
  if (!code?.trim()) {
    return { valid: false, percent: 0, message: "" };
  }
  const found = await findActiveDiscount(code);
  if (!found) {
    return { valid: false, percent: 0, message: "Ungültiger Code" };
  }
  return {
    valid: true,
    percent: found.percent,
    message: found.label,
  };
}
