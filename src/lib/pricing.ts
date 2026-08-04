/**
 * Monatspreise (EUR / Monat)
 * Host: 8 physische Kerne → max. 2 vCPU pro Server, Kapazitätslimit global
 *
 * Preis = Basis + CPU-Zuschlag + RAM + SSD (pro GB über dem Minimum)
 */
export const PRICING = {
  /** Basispreis (min. Config: 1 vCPU, 512 MB, 10 GB) */
  minPrice: 2.5,
  /** Deckel, falls Config extrem wird */
  maxPrice: 35,
  minCpu: 1,
  maxCpu: 2,
  minRamMb: 512,
  maxRamMb: 16384,
  minDiskGb: 10,
  maxDiskGb: 100,
  billingDays: 30,
  hostCpuCores: 8,
  hostCpuReserve: 1,
  cpuOvercommit: 1.25,

  /** € pro zusätzlichem vCPU über minCpu */
  pricePerExtraCpu: 2.0,
  /** € pro GB RAM über minRam (512 MB = 0,5 GB) */
  pricePerGbRam: 0.65,
  /** € pro GB SSD über minDiskGb */
  pricePerGbDisk: 0.12,
} as const;

/** Max. Summe vCPU über alle aktiven Server */
export function maxTotalCpu(): number {
  const usable = PRICING.hostCpuCores - PRICING.hostCpuReserve;
  return Math.max(1, Math.floor(usable * PRICING.cpuOvercommit));
}

export function calcPricePerMonth(
  cpu: number,
  ramMb: number,
  diskGb: number
): number {
  const minRamGb = PRICING.minRamMb / 1024;
  const ramGb = ramMb / 1024;

  const extraCpu = Math.max(0, cpu - PRICING.minCpu);
  const extraRamGb = Math.max(0, ramGb - minRamGb);
  const extraDiskGb = Math.max(0, diskGb - PRICING.minDiskGb);

  const raw =
    PRICING.minPrice +
    extraCpu * PRICING.pricePerExtraCpu +
    extraRamGb * PRICING.pricePerGbRam +
    extraDiskGb * PRICING.pricePerGbDisk;

  const clamped = Math.min(PRICING.maxPrice, Math.max(PRICING.minPrice, raw));
  return Math.round(clamped * 100) / 100;
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
