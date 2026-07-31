import { prisma } from "./db";

export const SETTING_MAINTENANCE = "maintenance_mode";

export async function getMaintenanceMode(): Promise<boolean> {
  try {
    const row = await prisma.appSetting.findUnique({
      where: { key: SETTING_MAINTENANCE },
    });
    return row?.value === "true" || row?.value === "1";
  } catch {
    return false;
  }
}

export async function setMaintenanceMode(enabled: boolean): Promise<void> {
  await prisma.appSetting.upsert({
    where: { key: SETTING_MAINTENANCE },
    create: { key: SETTING_MAINTENANCE, value: enabled ? "true" : "false" },
    update: { value: enabled ? "true" : "false" },
  });
}
