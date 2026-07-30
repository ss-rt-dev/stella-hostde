"use client";

import { useState } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

const amounts = [10, 25, 50, 100];

export default function DepositPage() {
  const [amount, setAmount] = useState(25);
  const [message, setMessage] = useState("");

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Guthaben aufladen
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Sicher bezahlen mit PayPal – erscheint als Stella Host.
        </p>
      </div>

      <div
        className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-6 backdrop-blur-xl"
        style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}
      >
        <div className="grid grid-cols-4 gap-2">
          {amounts.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAmount(a)}
              className={`rounded-xl py-3 text-sm font-medium transition ${
                amount === a
                  ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-md shadow-amber-500/20"
                  : "border border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08]"
              }`}
            >
              {a} €
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Betrag (€)
          </label>
          <input
            type="number"
            min={5}
            max={500}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm outline-none transition focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        {message && (
          <p
            className={`rounded-xl px-4 py-2.5 text-sm ${
              message.includes("erfolgreich") || message.includes("Erfolgreich")
                ? "border border-amber-500/20 bg-amber-500/10 text-amber-400"
                : "border border-red-500/20 bg-red-500/10 text-red-400"
            }`}
          >
            {message}
          </p>
        )}

        <PayPalScriptProvider
          options={{
            clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "test",
            currency: "EUR",
            intent: "capture",
          }}
        >
          <PayPalButtons
            style={{
              layout: "vertical",
              color: "gold",
              shape: "rect",
              label: "pay",
            }}
            createOrder={async () => {
              const res = await fetch("/api/paypal/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount }),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error);
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
                setMessage(`Erfolgreich ${result.amount} € gutgeschrieben!`);
              } else {
                setMessage(result.error || "Fehler bei der Zahlung");
              }
            }}
            onError={() => setMessage("PayPal-Fehler aufgetreten")}
          />
        </PayPalScriptProvider>

        <p className="text-center text-xs text-zinc-500">
          Zahlung an <strong className="text-zinc-400">Stella Host</strong> ·
          Sichere Abwicklung über PayPal
        </p>
      </div>
    </div>
  );
}
