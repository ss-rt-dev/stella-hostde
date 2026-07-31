import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).max(100),
});

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  try {
    const body = schema.parse(await req.json());
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { name: body.name },
    });
    return NextResponse.json({ name: user.name, email: user.email });
  } catch (e: any) {
    if (e?.name === "ZodError") {
      return NextResponse.json({ error: "Name ungültig" }, { status: 400 });
    }
    return NextResponse.json({ error: e.message || "Fehler" }, { status: 500 });
  }
}
