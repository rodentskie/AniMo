import { z } from "zod";

export const LOCATION_FIELD_MAX_LENGTH = 100;

const optionalPart = (label: string) =>
  z
    .string()
    .trim()
    .max(LOCATION_FIELD_MAX_LENGTH, `${label} must be at most ${LOCATION_FIELD_MAX_LENGTH} characters`)
    .nullish()
    .transform((value) => (value ? value : null));

export const locationSchema = z.object({
  province: z
    .string()
    .trim()
    .min(1, "Province is required")
    .max(LOCATION_FIELD_MAX_LENGTH, `Province must be at most ${LOCATION_FIELD_MAX_LENGTH} characters`),
  municipality: optionalPart("Municipality"),
  barangay: optionalPart("Barangay"),
});

export const locationIdSchema = z.string().min(1, "Location is required");

export type LocationInput = z.input<typeof locationSchema>;
export type LocationData = z.output<typeof locationSchema>;

export interface LocationParts {
  province: string;
  municipality: string | null;
  barangay: string | null;
}

export interface LocationRow extends LocationParts {
  id: string;
  isActive: boolean;
  recordCount: number;
  hasHistory: boolean;
}

export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}
