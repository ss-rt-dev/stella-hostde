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
        <h1 className="text-xl font-bold text-slate-800 sm:text-2xl">Guthaben aufladen</h1>
        <p className="text-sm text-slate-400">Sicher bezahlen mit PayPal</p>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-5">
        <div className="grid grid-cols-4 gap-2">
          {amounts.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAmount(a)}
              className={`rounded-xl py-3 text-sm font-semibold transition ${
                amount === a
                  ? "bg-[#3a57e8] text-white shadow-md shadow-blue-500/20"
                  : "border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {a} €
            </button>
          ))}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500">Betrag (€)</label>
          <input
            type="number"
            min={5}
            max={500}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#3a57e8] focus:ring-2 focus:ring-[#3a57e8]/20"
          />
        </div>

        {message && (
          <p
            className={`rounded-xl px-4 py-2.5 text-sm ${
              message.includes("erfolgreich") || message.includes("Erfolgreich")
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-600"
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
            style={{ layout: "vertical", color: "blue", shape: "rect", label: "pay" }}
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

        <p className="text-center text-xs text-slate-400">
          Zahlung an <strong>Stella Host</strong> · PayPal
        </p>
      </div>
    </div>
  );
}
