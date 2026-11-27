import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

// Runs `fn` in a transaction where the audit triggers record `userId` as the actor.
// `set_config(..., true)` is transaction-local, so it never leaks to pooled connections.
export async function withAuditUser<T>(
  userId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.user_id', ${userId}, true)`;
    return fn(tx);
  });
}
