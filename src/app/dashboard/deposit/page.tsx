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
        <p className="text-xs text-zinc-500">
          <span className="text-zinc-600">Dashboard</span>
          <span className="mx-1.5 text-zinc-700">›</span>
          <span className="text-amber-400/80">Billing</span>
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Guthaben aufladen
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Sicher bezahlen mit PayPal – erscheint als{" "}
          <span className="text-zinc-200">Stella Host</span>.
        </p>
      </div>

      <div className="rounded-2xl border border-white/8 bg-[#0e0e10] p-6 space-y-6">
        <div className="grid grid-cols-4 gap-2">
          {amounts.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAmount(a)}
              className={`rounded-xl py-3 text-sm font-medium transition ${
                amount === a
                  ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-md shadow-amber-500/20"
                  : "bg-white/5 text-zinc-300 hover:bg-white/10"
              }`}
            >
              {a} €
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <label className="text-sm text-zinc-400">Betrag (€)</label>
          <input
            type="number"
            min={5}
            max={500}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full rounded-xl border border-white/10 bg-[#08080a] px-4 py-2.5 outline-none transition focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
          />
        </div>

        {message && (
          <p
            className={`rounded-xl px-4 py-2.5 text-sm ${
              message.includes("erfolgreich") || message.includes("Erfolgreich")
                ? "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20"
                : "bg-red-500/10 text-red-400 ring-1 ring-red-500/20"
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
