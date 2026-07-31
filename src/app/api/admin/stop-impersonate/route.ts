import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, createImpersonateToken } from "@/lib/auth";

/** Zurück zur Admin-Session */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const adminId = (session.user as any).impersonatedBy as string | undefined;
  if (!adminId) {
    return NextResponse.json({ error: "Keine Impersonation aktiv" }, { status: 400 });
  }

  // Token wechselt zurück auf den Admin
  const token = createImpersonateToken(adminId, adminId);
  return NextResponse.json({ token });
}
