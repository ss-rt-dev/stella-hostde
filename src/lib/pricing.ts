/**
 * Monatspreise aus Ressourcen (EUR / Monat)
 * Hardware-Limit Host: 8 vCPU, 32 GB RAM, ~250 GB SSD
 */
export const PRICING = {
  cpuPerMonth: 4.0,
  ramGbPerMonth: 1.5,
  diskGbPerMonth: 0.25,
  minCpu: 1,
  maxCpu: 8,
  minRamMb: 512,
  maxRamMb: 32768,
  minDiskGb: 10,
  maxDiskGb: 250,
  /** Tage bis zur nächsten Monatsabrechnung */
  billingDays: 30,
} as const;

/** Monatspreis in EUR */
export function calcPricePerMonth(
  cpu: number,
  ramMb: number,
  diskGb: number
): number {
  const ramGb = ramMb / 1024;
  const raw =
    cpu * PRICING.cpuPerMonth +
    ramGb * PRICING.ramGbPerMonth +
    diskGb * PRICING.diskGbPerMonth;
  return Math.round(raw * 100) / 100;
}

/** @deprecated Alias – gleiche Logik wie calcPricePerMonth (DB-Feld heißt noch pricePerHour) */
export function calcPricePerHour(
  cpu: number,
  ramMb: number,
  diskGb: number
): number {
  return calcPricePerMonth(cpu, ramMb, diskGb);
}

export function clampConfig(cpu: number, ramMb: number, diskGb: number) {
  return {
    cpu: Math.min(PRICING.maxCpu, Math.max(PRICING.minCpu, Math.round(cpu))),
    ramMb: Math.min(
      PRICING.maxRamMb,
      Math.max(PRICING.minRamMb, Math.round(ramMb))
    ),
    diskGb: Math.min(
      PRICING.maxDiskGb,
      Math.max(PRICING.minDiskGb, Math.round(diskGb))
    ),
  };
}
