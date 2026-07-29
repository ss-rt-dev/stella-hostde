import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-xl text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">
          Server Dashboard
        </h1>
        <p className="text-zinc-400 text-lg">
          LXC-Container mieten – schnell, günstig und vollautomatisch über Proxmox.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="rounded-lg bg-emerald-600 px-6 py-3 font-medium hover:bg-emerald-500 transition"
          >
            Anmelden
          </Link>
          <Link
            href="/register"
            className="rounded-lg border border-zinc-700 px-6 py-3 font-medium hover:bg-zinc-900 transition"
          >
            Registrieren
          </Link>
        </div>
      </div>
    </main>
  );
}
