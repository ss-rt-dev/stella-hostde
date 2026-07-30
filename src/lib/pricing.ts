/**
 * Stundensatz aus Ressourcen (EUR)
 * Hardware-Limit Host: 8 vCPU, 32 GB RAM, ~265 GB SSD
 */
export const PRICING = {
  cpuPerHour: 0.015,
  ramGbPerHour: 0.008,
  diskGbPerHour: 0.0015,
  minCpu: 1,
  maxCpu: 8,
  minRamMb: 512,
  maxRamMb: 32768,
  minDiskGb: 10,
  maxDiskGb: 250,
} as const;

export function calcPricePerHour(cpu: number, ramMb: number, diskGb: number): number {
  const ramGb = ramMb / 1024;
  const raw =
    cpu * PRICING.cpuPerHour +
    ramGb * PRICING.ramGbPerHour +
    diskGb * PRICING.diskGbPerHour;
  return Math.round(raw * 10000) / 10000;
}

export function clampConfig(cpu: number, ramMb: number, diskGb: number) {
  return {
    cpu: Math.min(PRICING.maxCpu, Math.max(PRICING.minCpu, Math.round(cpu))),
    ramMb: Math.min(PRICING.maxRamMb, Math.max(PRICING.minRamMb, Math.round(ramMb))),
    diskGb: Math.min(PRICING.maxDiskGb, Math.max(PRICING.minDiskGb, Math.round(diskGb))),
  };
}
