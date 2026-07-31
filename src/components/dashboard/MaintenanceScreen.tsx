import Image from "next/image";

const LOGO = "https://cdn3.emoji.gg/emojis/847706-pixelstar.gif";

export function MaintenanceScreen() {
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
        <p className="mt-4 text-xs text-zinc-600">Stella Host</p>
      </div>
    </div>
  );
}
