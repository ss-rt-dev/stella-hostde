/** Rabattcodes – erweiterbar */
export const DISCOUNT_CODES: Record<
  string,
  { percent: number; label: string }
> = {
  "NEXUS-10": { percent: 10, label: "10 % Rabatt" },
};

export function applyDiscount(
  price: number,
  code: string | null | undefined
): { price: number; percent: number; code: string | null } {
  if (!code) return { price, percent: 0, code: null };
  const key = code.trim().toUpperCase();
  const found = DISCOUNT_CODES[key];
  if (!found) return { price, percent: 0, code: null };
  const discounted =
    Math.round(price * (1 - found.percent / 100) * 100) / 100;
  return { price: discounted, percent: found.percent, code: key };
}

export function validateDiscountCode(code: string | null | undefined): {
  valid: boolean;
  percent: number;
  message: string;
} {
  if (!code || !code.trim()) {
    return { valid: false, percent: 0, message: "" };
  }
  const key = code.trim().toUpperCase();
  const found = DISCOUNT_CODES[key];
  if (!found) {
    return { valid: false, percent: 0, message: "Ungültiger Code" };
  }
  return {
    valid: true,
    percent: found.percent,
    message: found.label,
  };
}
