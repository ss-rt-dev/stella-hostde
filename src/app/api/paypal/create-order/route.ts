import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  amount: z.number().min(5).max(500),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { amount } = schema.parse(body);

    const clientId = process.env.PAYPAL_CLIENT_ID?.trim();
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET?.trim();
    const mode = (process.env.PAYPAL_MODE || "sandbox").toLowerCase();

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        {
          error:
            "PayPal nicht konfiguriert: PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET in Vercel setzen",
        },
        { status: 500 }
      );
    }

    const base =
      mode === "live"
        ? "https://api-m.paypal.com"
        : "https://api-m.sandbox.paypal.com";

    const tokenRes = await fetch(`${base}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    const tokenJson = await tokenRes.json();
    if (!tokenJson.access_token) {
      console.error("PayPal token error", tokenJson);
      return NextResponse.json(
        {
          error:
            mode === "live"
              ? "PayPal Live-Login fehlgeschlagen – Client-ID/Secret prüfen (Live-App!)"
              : "PayPal Sandbox-Login fehlgeschlagen – Client-ID/Secret und PAYPAL_MODE prüfen",
        },
        { status: 500 }
      );
    }

    const orderRes = await fetch(`${base}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenJson.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "EUR",
              value: amount.toFixed(2),
            },
            description: `Stella Host Guthaben ${amount.toFixed(2)} EUR`,
            custom_id: session.user.id,
          },
        ],
        application_context: {
          brand_name: "Stella Host",
          shipping_preference: "NO_SHIPPING",
          user_action: "PAY_NOW",
          return_url: `${process.env.NEXTAUTH_URL || "https://stella-host.de"}/dashboard/deposit?success=1`,
          cancel_url: `${process.env.NEXTAUTH_URL || "https://stella-host.de"}/dashboard/deposit?cancel=1`,
        },
      }),
    });

    const order = await orderRes.json();

    if (!order.id) {
      console.error("PayPal order error", order);
      const detail =
        order?.details?.[0]?.description ||
        order?.message ||
        order?.error_description ||
        "Order konnte nicht erstellt werden";
      return NextResponse.json(
        { error: `PayPal: ${detail}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ id: order.id });
  } catch (e: any) {
    console.error(e);
    if (e?.name === "ZodError") {
      return NextResponse.json(
        { error: "Betrag muss zwischen 5 und 500 € liegen" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: e.message || "Serverfehler" },
      { status: 500 }
    );
  }
}
