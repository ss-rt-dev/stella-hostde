"use client";

import { useState } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

const amounts = [10, 25, 50, 100];

export default function DepositPage() {
  const [amount, setAmount] = useState(25);
  const [message, setMessage] = useState("");

  return (
    <div className="space-y-8 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold">Guthaben aufladen</h1>
        <p className="text-zinc-400">Zahle sicher mit PayPal</p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-6">
        <div className="grid grid-cols-4 gap-2">
          {amounts.map((a) => (
            <button
              key={a}
              onClick={() => setAmount(a)}
              className={`rounded-lg py-3 text-sm font-medium transition ${
                amount === a
                  ? "bg-emerald-600 text-white"
                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
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
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2.5 outline-none focus:border-emerald-500"
          />
        </div>

        {message && (
          <p
            className={`rounded-lg px-4 py-2 text-sm ${
              message.includes("erfolgreich")
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-red-500/10 text-red-400"
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
            style={{ layout: "vertical", color: "gold" }}
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
      </div>
    </div>
  );
}
