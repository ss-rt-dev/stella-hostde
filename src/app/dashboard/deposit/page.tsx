"use client";

import { useMemo, useState } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

const amounts = [10, 25, 50, 100];

export default function DepositPage() {
  const [amount, setAmount] = useState(25);
  const [message, setMessage] = useState("");

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";
  const paypalReady = Boolean(clientId && clientId !== "test");

  const options = useMemo(
    () => ({
      clientId: clientId || "test",
      currency: "EUR" as const,
      intent: "capture" as const,
    }),
    [clientId]
  );

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white sm:text-2xl">
          Guthaben aufladen
        </h1>
        <p className="text-sm text-zinc-500">
          Sicher bezahlen mit PayPal · Stella Host
        </p>
      </div>

      <div className="space-y-5 rounded-2xl border border-white/10 bg-[#121214] p-6">
        <div className="grid grid-cols-4 gap-2">
          {amounts.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAmount(a)}
              className={`rounded-xl py-3 text-sm font-semibold transition ${
                amount === a
                  ? "bg-amber-400 text-black"
                  : "border border-white/10 text-zinc-300 hover:bg-white/5"
              }`}
            >
              {a} €
            </button>
          ))}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-500">
            Betrag (€)
          </label>
          <input
            type="number"
            min={5}
            max={500}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500/50"
          />
        </div>

        {message && (
          <p
            className={`rounded-xl px-4 py-2.5 text-sm ${
              message.includes("erfolgreich") ||
              message.includes("Erfolgreich")
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-red-500/10 text-red-400"
            }`}
          >
            {message}
          </p>
        )}

        {!paypalReady ? (
          <p className="rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
            PayPal ist nicht konfiguriert. In Vercel setzen:{" "}
            <code className="text-xs">NEXT_PUBLIC_PAYPAL_CLIENT_ID</code>,{" "}
            <code className="text-xs">PAYPAL_CLIENT_ID</code>,{" "}
            <code className="text-xs">PAYPAL_CLIENT_SECRET</code>, optional{" "}
            <code className="text-xs">PAYPAL_MODE=sandbox|live</code>
          </p>
        ) : (
          <PayPalScriptProvider options={options}>
            <PayPalButtons
              style={{
                layout: "vertical",
                color: "gold",
                shape: "rect",
                label: "pay",
              }}
              forceReRender={[amount]}
              createOrder={async () => {
                setMessage("");
                const res = await fetch("/api/paypal/create-order", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ amount }),
                });
                const data = await res.json();
                if (!res.ok) {
                  setMessage(data.error || "Order fehlgeschlagen");
                  throw new Error(data.error || "Order fehlgeschlagen");
                }
                return data.id;
              }}
              onApprove={async (data) => {
                const res = await fetch("/api/paypal/capture", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ orderID: data.orderID }),
                });
                const result = await res.json();
                if (res.ok) {
                  setMessage(
                    `Erfolgreich ${result.amount} € gutgeschrieben!`
                  );
                } else {
                  setMessage(result.error || "Fehler bei der Zahlung");
                }
              }}
              onError={(err) => {
                console.error(err);
                setMessage(
                  "PayPal-Fehler – Client-ID (Sandbox/Live) und PAYPAL_MODE prüfen"
                );
              }}
              onCancel={() => setMessage("Zahlung abgebrochen")}
            />
          </PayPalScriptProvider>
        )}

        <p className="text-center text-xs text-zinc-500">
          Zahlung an <strong className="text-zinc-400">Stella Host</strong> ·
          PayPal
        </p>
      </div>
    </div>
  );
}
