import { NextResponse } from "next/server";
import { validateDiscountCode } from "@/lib/discounts";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code") || "";
  const result = await validateDiscountCode(code);
  return NextResponse.json(result);
}
