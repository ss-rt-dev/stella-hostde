/**
 * Monatspreise (EUR / Monat)
 * Zielspanne: ca. 2,50 € (Minimum) bis 20 € (Maximum)
 */
export const PRICING = {
  minPrice: 2.5,
  maxPrice: 20,
  minCpu: 1,
  maxCpu: 8,
  minRamMb: 512,
  maxRamMb: 32768,
  minDiskGb: 10,
  maxDiskGb: 250,
  billingDays: 30,
} as const;

export function calcPricePerMonth(
  cpu: number,
  ramMb: number,
  diskGb: number
): number {
  const cpuN =
    (cpu - PRICING.minCpu) / (PRICING.maxCpu - PRICING.minCpu);
  const ramN =
    (ramMb - PRICING.minRamMb) / (PRICING.maxRamMb - PRICING.minRamMb);
  const diskN =
    (diskGb - PRICING.minDiskGb) / (PRICING.maxDiskGb - PRICING.minDiskGb);

  const score =
    Math.min(1, Math.max(0, cpuN)) * 0.4 +
    Math.min(1, Math.max(0, ramN)) * 0.4 +
    Math.min(1, Math.max(0, diskN)) * 0.2;

  const raw =
    PRICING.minPrice + score * (PRICING.maxPrice - PRICING.minPrice);
  return Math.round(raw * 100) / 100;
}

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
