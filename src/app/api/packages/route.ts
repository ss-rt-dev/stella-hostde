import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const packages = await prisma.package.findMany({
    where: { active: true },
    orderBy: { pricePerHour: "asc" },
  });
  return NextResponse.json(packages);
}
