"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("E-Mail oder Passwort falsch");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-6 rounded-xl border border-zinc-800 bg-zinc-900 p-8"
      >
        <h1 className="text-2xl font-bold">Anmelden</h1>

        {error && (
          <p className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        <div className="space-y-2">
          <label className="text-sm text-zinc-400">E-Mail</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2.5 outline-none focus:border-emerald-500"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-zinc-400">Passwort</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2.5 outline-none focus:border-emerald-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-emerald-600 py-2.5 font-medium hover:bg-emerald-500 disabled:opacity-50 transition"
        >
          {loading ? "Wird angemeldet…" : "Anmelden"}
        </button>

        <p className="text-center text-sm text-zinc-500">
          Noch kein Konto? Jetzt Registrieren{" "}
          <Link href="/register" className="text-emerald-400 hover:underline">
            Registrieren
          </Link>
        </p>
      </form>
    </main>
  );
}
