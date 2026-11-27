"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { withAuditUser } from "@/lib/audit";
import { authorize, PERMISSION_DENIED_ERROR } from "@/lib/guards";
import { locationIdSchema, locationSchema, type ActionResult, type LocationData, type LocationInput } from "@/types/location";

const LOCATIONS_PATH = "/settings/locations";
const DUPLICATE_ERROR = "This location already exists";
const HAS_DATA_ERROR = "This location has data. Deactivate it instead.";
const NOT_FOUND_ERROR = "Location not found";
const GENERIC_ERROR = "Something went wrong. Please try again.";

interface LocationResult {
  id: string;
}

class LocationActionError extends Error {}

type Tx = Prisma.TransactionClient;

function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input";
}

function toErrorMessage(error: unknown): string {
  if (error instanceof LocationActionError) return error.message;
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return DUPLICATE_ERROR;
    if (error.code === "P2025") return NOT_FOUND_ERROR;
    if (error.code === "P2003") return HAS_DATA_ERROR;
  }
  console.error(error);
  return GENERIC_ERROR;
}

// Postgres treats NULLs as distinct in unique indexes, so (province, NULL, NULL) needs an explicit check.
async function assertUnique(tx: Tx, data: LocationData, excludeId?: string): Promise<void> {
  const existing = await tx.location.findFirst({
    where: {
      province: { equals: data.province, mode: "insensitive" },
      municipality: data.municipality === null ? null : { equals: data.municipality, mode: "insensitive" },
      barangay: data.barangay === null ? null : { equals: data.barangay, mode: "insensitive" },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });
  if (existing) throw new LocationActionError(DUPLICATE_ERROR);
}

async function runLocationAction(
  action: string,
  fn: (userId: string) => Promise<LocationResult>,
): Promise<ActionResult<LocationResult>> {
  const user = await authorize(action);
  if (!user) return { success: false, error: PERMISSION_DENIED_ERROR };

  try {
    const data = await fn(user.id);
    revalidatePath(LOCATIONS_PATH);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: toErrorMessage(error) };
  }
}

function parseOrThrow<T>(schema: z.ZodType<T>, input: unknown): T {
  const parsed = schema.safeParse(input);
  if (!parsed.success) throw new LocationActionError(firstIssue(parsed.error));
  return parsed.data;
}

export async function createLocation(input: LocationInput): Promise<ActionResult<LocationResult>> {
  return runLocationAction("location:Create", async (userId) => {
    const data = parseOrThrow(locationSchema, input);
    return withAuditUser(userId, async (tx) => {
      await assertUnique(tx, data);
      return tx.location.create({ data, select: { id: true } });
    });
  });
}

export async function updateLocation(id: string, input: LocationInput): Promise<ActionResult<LocationResult>> {
  return runLocationAction("location:Update", async (userId) => {
    const locationId = parseOrThrow(locationIdSchema, id);
    const data = parseOrThrow(locationSchema, input);
    return withAuditUser(userId, async (tx) => {
      await assertUnique(tx, data, locationId);
      return tx.location.update({ where: { id: locationId }, data, select: { id: true } });
    });
  });
}

export async function setLocationActive(id: string, isActive: boolean): Promise<ActionResult<LocationResult>> {
  return runLocationAction("location:Update", async (userId) => {
    const locationId = parseOrThrow(locationIdSchema, id);
    const active = parseOrThrow(z.boolean(), isActive);
    return withAuditUser(userId, (tx) =>
      tx.location.update({ where: { id: locationId }, data: { isActive: active }, select: { id: true } }),
    );
  });
}

export async function deleteLocation(id: string): Promise<ActionResult<LocationResult>> {
  return runLocationAction("location:Delete", async (userId) => {
    const locationId = parseOrThrow(locationIdSchema, id);
    return withAuditUser(userId, async (tx) => {
      const location = await tx.location.findUnique({
        where: { id: locationId },
        select: { _count: { select: { productionRecords: true, predictions: true, evaluations: true } } },
      });
      if (!location) throw new LocationActionError(NOT_FOUND_ERROR);
      const { productionRecords, predictions, evaluations } = location._count;
      if (productionRecords + predictions + evaluations > 0) throw new LocationActionError(HAS_DATA_ERROR);
      return tx.location.delete({ where: { id: locationId }, select: { id: true } });
    });
  });
}
