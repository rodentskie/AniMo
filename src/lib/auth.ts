import "server-only";
import bcrypt from "bcryptjs";
import type { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import {
  RATE_LIMIT_MESSAGE,
  getClientIp,
  isRateLimited,
  recordLoginAttempt,
} from "@/lib/auth-rate-limit";
import { loginSchema } from "@/types/auth";

// Compared against when the email is unknown so the response time doesn't reveal which emails exist.
const DUMMY_PASSWORD_HASH = "$2b$12$I2..VoURL3j/zDDh9KhJaOSo.u1RsCyzdZCaU5Tju/7C9sGA52Ts.";

async function verifyCredentials(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  const passwordMatches = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);
  return user && user.isActive && passwordMatches ? user : null;
}

async function markLoggedIn(userId: string) {
  await prisma.$transaction([
    prisma.$executeRaw`SELECT set_config('app.user_id', ${userId}, true)`,
    prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } }),
  ]);
}

async function authorize(
  credentials: Record<string, string> | undefined,
  headers: Record<string, string | string[] | undefined> | undefined,
): Promise<User | null> {
  const parsed = loginSchema.safeParse(credentials);
  if (!parsed.success) return null;

  const { email, password } = parsed.data;
  const ip = getClientIp(headers);

  if (await isRateLimited(email, ip)) {
    await recordLoginAttempt(email, ip, false);
    throw new Error(RATE_LIMIT_MESSAGE);
  }

  const user = await verifyCredentials(email, password);
  await recordLoginAttempt(email, ip, user !== null);
  if (!user) return null;

  await markLoggedIn(user.id);

  return {
    id: user.id,
    email: user.email,
    name: `${user.firstName} ${user.lastName}`,
    tokenVersion: user.tokenVersion,
  };
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: (credentials, req) => authorize(credentials, req.headers),
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.tokenVersion = user.tokenVersion;
      }
      return token;
    },
    session({ session, token }) {
      session.user = { id: token.userId };
      session.tokenVersion = token.tokenVersion;
      return session;
    },
  },
};
