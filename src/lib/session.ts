import "server-only";
import { getServerSession } from "next-auth";
import { cache } from "react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { CurrentUser } from "@/types/iam";

export const getSession = cache(() => getServerSession(authOptions));

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await getSession();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      isActive: true,
      tokenVersion: true,
      roles: {
        select: {
          role: {
            select: {
              name: true,
              policies: {
                select: {
                  policy: {
                    select: {
                      statements: { select: { effect: true, actions: true, resources: true } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user || !user.isActive || user.tokenVersion !== session.tokenVersion) return null;

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    roleNames: user.roles.map(({ role }) => role.name),
    statements: user.roles.flatMap(({ role }) => role.policies.flatMap(({ policy }) => policy.statements)),
  };
});
