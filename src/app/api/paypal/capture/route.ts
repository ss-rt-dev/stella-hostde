import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  try {
    const { orderID } = await req.json();
    if (!orderID) {
      return NextResponse.json({ error: "Keine Order-ID" }, { status: 400 });
    }

    // Doppelte Gutschrift verhindern
    const existing = await prisma.transaction.findFirst({
      where: { paypalOrderId: orderID },
    });
    if (existing) {
      return NextResponse.json({
        success: true,
        amount: Number(existing.amount),
        alreadyCredited: true,
      });
    }

    const clientId = process.env.PAYPAL_CLIENT_ID?.trim();
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET?.trim();
    const mode = (process.env.PAYPAL_MODE || "sandbox").toLowerCase();

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "PayPal nicht konfiguriert" },
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
      return NextResponse.json(
        { error: "PayPal Auth fehlgeschlagen" },
        { status: 500 }
      );
    }

    const captureRes = await fetch(
      `${base}/v2/checkout/orders/${orderID}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenJson.access_token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const capture = await captureRes.json();

    if (capture.status !== "COMPLETED") {
      console.error("PayPal capture", capture);
      const detail =
        capture?.details?.[0]?.description ||
        capture?.message ||
        "Zahlung nicht abgeschlossen";
      return NextResponse.json({ error: `PayPal: ${detail}` }, { status: 400 });
    }

    const amount = parseFloat(
      capture.purchase_units[0].payments.captures[0].amount.value
    );

    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data: { balance: { increment: amount } },
      }),
      prisma.transaction.create({
        data: {
          userId: session.user.id,
          type: "DEPOSIT",
          amount,
          description: "PayPal Aufladung",
          paypalOrderId: orderID,
        },
      }),
    ]);

    return NextResponse.json({ success: true, amount });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: e.message || "Serverfehler" },
      { status: 500 }
    );
  }
}
