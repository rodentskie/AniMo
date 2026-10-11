import "server-only";
import { prisma } from "@/lib/prisma";

const MAX_FAILED_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

export const RATE_LIMIT_MESSAGE = "Too many attempts, try again later";

type HeaderValue = string | string[] | undefined;

function firstHeader(value: HeaderValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function getClientIp(headers: Record<string, HeaderValue> | undefined): string | null {
  const forwardedFor = firstHeader(headers?.["x-forwarded-for"])?.split(",")[0]?.trim();
  const realIp = firstHeader(headers?.["x-real-ip"])?.trim();
  return forwardedFor || realIp || null;
}

export async function isRateLimited(email: string, ip: string | null): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_MS);

  const [emailFailures, ipFailures] = await Promise.all([
    prisma.loginAttempt.count({
      where: { email, success: false, createdAt: { gte: since } },
    }),
    ip
      ? prisma.loginAttempt.count({
          where: { ip, success: false, createdAt: { gte: since } },
        })
      : Promise.resolve(0),
  ]);

  return emailFailures >= MAX_FAILED_ATTEMPTS || ipFailures >= MAX_FAILED_ATTEMPTS;
}

export async function recordLoginAttempt(email: string, ip: string | null, success: boolean) {
  await prisma.loginAttempt.create({ data: { email, ip, success } });
}
