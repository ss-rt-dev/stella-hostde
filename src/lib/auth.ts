import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "./db";
import { recordLogin, logActivity } from "./activity";

function getSecret() {
  return process.env.NEXTAUTH_SECRET || "dev-secret";
}

/** Rolle max. alle 5 Min. aus DB – spart DB-Hits bei jedem Request */
const ROLE_REFRESH_MS = 5 * 60 * 1000;

export function createImpersonateToken(adminId: string, userId: string) {
  const exp = Date.now() + 60_000;
  const payload = `${adminId}.${userId}.${exp}`;
  const sig = createHmac("sha256", getSecret()).update(payload).digest("hex");
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

export function verifyImpersonateToken(token: string): {
  adminId: string;
  userId: string;
} | null {
  try {
    const raw = Buffer.from(token, "base64url").toString("utf8");
    const parts = raw.split(".");
    if (parts.length !== 4) return null;
    const [adminId, userId, expStr, sig] = parts;
    const payload = `${adminId}.${userId}.${expStr}`;
    const expected = createHmac("sha256", getSecret()).update(payload).digest("hex");
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    if (Date.now() > Number(expStr)) return null;
    return { adminId, userId };
  } catch {
    return null;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "E-Mail", type: "email" },
        password: { label: "Passwort", type: "password" },
        impersonateToken: { label: "Impersonate", type: "text" },
      },
      async authorize(credentials) {
        if (credentials?.impersonateToken) {
          const data = verifyImpersonateToken(credentials.impersonateToken);
          if (!data) return null;

          const target = await prisma.user.findUnique({
            where: { id: data.userId },
          });
          if (!target) return null;

          const admin = await prisma.user.findUnique({
            where: { id: data.adminId },
          });
          if (!admin || admin.role !== "ADMIN") return null;

          const impersonatedBy =
            target.id === data.adminId ? undefined : data.adminId;

          if (impersonatedBy) {
            void logActivity({
              userId: target.id,
              action: "admin_impersonate",
              detail: `Admin-Login als Nutzer (${admin.email})`,
              meta: { adminId: admin.id },
            });
          }

          return {
            id: target.id,
            email: target.email,
            name: target.name,
            role: target.role,
            impersonatedBy,
          } as any;
        }

        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) return null;

        const valid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!valid) return null;

        // Login-Log nicht blockierend
        void recordLogin(user.id);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        (token as any).roleRefreshedAt = Date.now();
        if ((user as any).impersonatedBy) {
          token.impersonatedBy = (user as any).impersonatedBy;
        } else {
          delete token.impersonatedBy;
        }
        return token;
      }

      // Nur alle 5 Min. Rolle aus DB – verhindert langsames Dashboard
      const last = Number((token as any).roleRefreshedAt || 0);
      if (
        token.id &&
        !(token as any).impersonatedBy &&
        Date.now() - last > ROLE_REFRESH_MS
      ) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: String(token.id) },
            select: { role: true, name: true, email: true },
          });
          if (dbUser) {
            token.role = dbUser.role;
            if (dbUser.name != null) token.name = dbUser.name;
            if (dbUser.email) token.email = dbUser.email;
          }
          (token as any).roleRefreshedAt = Date.now();
        } catch (e) {
          console.error("jwt role refresh", e);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
        (session.user as any).impersonatedBy = token.impersonatedBy;
        session.user.name = token.name as string | null | undefined;
        session.user.email = token.email as string | null | undefined;
      }
      return session;
    },
  },
};
