import { prisma } from "./db";

export const SETTING_MAINTENANCE = "maintenance_mode";
export const SETTING_MAINTENANCE_SCHEDULE = "maintenance_schedule";

export type MaintenanceSchedule = {
  /** YYYY-MM-DD optional */
  dateFrom?: string | null;
  /** YYYY-MM-DD optional */
  dateTo?: string | null;
  /** HH:MM optional */
  timeFrom?: string | null;
  /** HH:MM optional */
  timeTo?: string | null;
};

export type MaintenanceConfig = {
  enabled: boolean;
  schedule: MaintenanceSchedule;
  /** true = Kunden sehen Wartungsseite jetzt */
  activeNow: boolean;
};

async function getSetting(key: string): Promise<string | null> {
  try {
    const row = await prisma.appSetting.findUnique({ where: { key } });
    return row?.value ?? null;
  } catch {
    return null;
  }
}

async function setSetting(key: string, value: string): Promise<void> {
  await prisma.appSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

export async function getMaintenanceSchedule(): Promise<MaintenanceSchedule> {
  const raw = await getSetting(SETTING_MAINTENANCE_SCHEDULE);
  if (!raw) return {};
  try {
    const p = JSON.parse(raw);
    return {
      dateFrom: p.dateFrom || null,
      dateTo: p.dateTo || null,
      timeFrom: p.timeFrom || null,
      timeTo: p.timeTo || null,
    };
  } catch {
    return {};
  }
}

/** Aktuelle Zeit in Europe/Berlin */
function berlinParts(now = new Date()) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(now).map((p) => [p.type, p.value])
  );
  // hour kann "24" sein bei manchen Engines um Mitternacht
  let hour = parts.hour === "24" ? "00" : parts.hour;
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(hour) * 60 + Number(parts.minute),
  };
}

function parseHHMM(s: string): number | null {
  const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(s.trim());
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

/**
 * Prüft ob Wartung *jetzt* greift.
 * - enabled aus → nie
 * - enabled, kein Zeitplan → immer
 * - mit Datum/Zeit → nur im Fenster (Zeitzone Europe/Berlin)
 */
export function isMaintenanceActiveNow(
  enabled: boolean,
  schedule: MaintenanceSchedule,
  now = new Date()
): boolean {
  if (!enabled) return false;

  const { dateFrom, dateTo, timeFrom, timeTo } = schedule;
  const hasDate = Boolean(dateFrom || dateTo);
  const hasTime = Boolean(timeFrom || timeTo);

  if (!hasDate && !hasTime) return true;

  const { date: today, minutes: nowMin } = berlinParts(now);

  if (hasDate) {
    if (dateFrom && today < dateFrom) return false;
    if (dateTo && today > dateTo) return false;
  }

  if (hasTime) {
    const fromMin = timeFrom ? parseHHMM(timeFrom) : 0;
    const toMin = timeTo ? parseHHMM(timeTo) : 24 * 60 - 1;
    if (fromMin === null || toMin === null) return true;

    // Über Mitternacht (z.B. 22:00–06:00)
    if (fromMin <= toMin) {
      if (nowMin < fromMin || nowMin > toMin) return false;
    } else {
      // außerhalb = zwischen to und from
      if (nowMin > toMin && nowMin < fromMin) return false;
    }
  }

  return true;
}

export async function getMaintenanceConfig(): Promise<MaintenanceConfig> {
  const enabledRaw = await getSetting(SETTING_MAINTENANCE);
  const enabled = enabledRaw === "true" || enabledRaw === "1";
  const schedule = await getMaintenanceSchedule();
  return {
    enabled,
    schedule,
    activeNow: isMaintenanceActiveNow(enabled, schedule),
  };
}

/** @deprecated use getMaintenanceConfig().activeNow */
export async function getMaintenanceMode(): Promise<boolean> {
  const c = await getMaintenanceConfig();
  return c.activeNow;
}

export async function setMaintenanceConfig(opts: {
  enabled: boolean;
  schedule?: MaintenanceSchedule;
}): Promise<MaintenanceConfig> {
  await setSetting(SETTING_MAINTENANCE, opts.enabled ? "true" : "false");
  if (opts.schedule !== undefined) {
    const clean: MaintenanceSchedule = {
      dateFrom: opts.schedule.dateFrom?.trim() || null,
      dateTo: opts.schedule.dateTo?.trim() || null,
      timeFrom: opts.schedule.timeFrom?.trim() || null,
      timeTo: opts.schedule.timeTo?.trim() || null,
    };
    await setSetting(SETTING_MAINTENANCE_SCHEDULE, JSON.stringify(clean));
  }
  return getMaintenanceConfig();
}

export async function setMaintenanceMode(enabled: boolean): Promise<void> {
  await setSetting(SETTING_MAINTENANCE, enabled ? "true" : "false");
}
