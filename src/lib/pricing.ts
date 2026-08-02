/**
 * Monatspreise (EUR / Monat)
 * Host: 8 physische Kerne → max. 2 vCPU pro Server, Kapazitätslimit global
 */
export const PRICING = {
  minPrice: 2.5,
  maxPrice: 20,
  /** Min. vCPU pro Server */
  minCpu: 1,
  /** Max. vCPU pro Server (Host hat nur 8 Kerne) */
  maxCpu: 2,
  minRamMb: 512,
  maxRamMb: 16384,
  minDiskGb: 10,
  maxDiskGb: 100,
  billingDays: 30,
  /** Physische Kerne des Proxmox-Hosts */
  hostCpuCores: 8,
  /** Kerne fürs System freilassen */
  hostCpuReserve: 1,
  /**
   * Wie stark darf überbucht werden? 1.0 = streng, 1.5 = 50% Overcommit.
   * Bei 8 Kernen, Reserve 1, Factor 1.5 → max. 10,5 ≈ 10 vCPU gesamt.
   */
  cpuOvercommit: 1.25,
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
  const cpuN =
    (cpu - PRICING.minCpu) / Math.max(1, PRICING.maxCpu - PRICING.minCpu);
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
