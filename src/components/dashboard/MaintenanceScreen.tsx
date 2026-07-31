import Image from "next/image";
import { getMaintenanceConfig } from "@/lib/settings";

const LOGO = "https://cdn3.emoji.gg/emojis/36006-yellow.png";

export async function MaintenanceScreen() {
  const config = await getMaintenanceConfig();
  const { dateFrom, dateTo, timeFrom, timeTo } = config.schedule;

  const parts: string[] = [];
  if (dateFrom || dateTo) {
    if (dateFrom && dateTo) parts.push(`${fmtDate(dateFrom)} – ${fmtDate(dateTo)}`);
    else if (dateFrom) parts.push(`ab ${fmtDate(dateFrom)}`);
    else if (dateTo) parts.push(`bis ${fmtDate(dateTo)}`);
  }
  if (timeFrom || timeTo) {
    if (timeFrom && timeTo) parts.push(`${timeFrom} – ${timeTo} Uhr`);
    else if (timeFrom) parts.push(`ab ${timeFrom} Uhr`);
    else if (timeTo) parts.push(`bis ${timeTo} Uhr`);
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="glass-amber max-w-md rounded-3xl border border-amber-500/25 p-8 sm:p-10">
        <Image
          src={LOGO}
          alt="Stella Host"
          width={72}
          height={72}
          className="mx-auto h-16 w-16 object-contain"
          unoptimized
        />
        <h1 className="mt-5 text-2xl font-bold text-white">Wartungsarbeiten</h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          Wir sind gerade bei Wartungsarbeiten. Bitte hab ein wenig Geduld –
          das Dashboard ist in Kürze wieder verfügbar.
        </p>
        {parts.length > 0 && (
          <p className="mt-4 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-amber-400/90">
            Geplant: {parts.join(" · ")}
            <span className="text-zinc-600"> (Berlin)</span>
          </p>
        )}
        <p className="mt-4 text-xs text-zinc-600">Stella Host</p>
      </div>
    </div>
  );
}

function fmtDate(iso: string) {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}.${m}.${y}`;
}
