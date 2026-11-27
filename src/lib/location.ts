import type { LocationParts } from "@/types/location";

export function formatLocation(location: LocationParts): string {
  return [location.barangay, location.municipality, location.province]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");
}
