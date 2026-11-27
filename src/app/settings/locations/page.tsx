import { Container, Heading, HStack, Stack, Text } from "@chakra-ui/react"
import type { Metadata } from "next"
import { AppShell } from "@/components/layout/AppShell"
import { LocationFormDialog } from "@/components/locations/LocationFormDialog"
import { LocationsTable } from "@/components/locations/LocationsTable"
import { can, requirePermission } from "@/lib/guards"
import { prisma } from "@/lib/prisma"
import type { LocationRow } from "@/types/location"

export const metadata: Metadata = {
  title: "Locations",
}

async function getLocationRows(): Promise<LocationRow[]> {
  const locations = await prisma.location.findMany({
    orderBy: [{ province: "asc" }, { municipality: "asc" }, { barangay: "asc" }],
    select: {
      id: true,
      province: true,
      municipality: true,
      barangay: true,
      isActive: true,
      _count: { select: { productionRecords: true, predictions: true, evaluations: true } },
    },
  })

  return locations.map(({ _count, ...location }) => ({
    ...location,
    recordCount: _count.productionRecords,
    hasHistory: _count.productionRecords + _count.predictions + _count.evaluations > 0,
  }))
}

export default async function LocationsPage() {
  const user = await requirePermission("location:Read")
  const locations = await getLocationRows()
  const permissions = {
    canUpdate: can(user, "location:Update"),
    canDelete: can(user, "location:Delete"),
  }

  return (
    <AppShell user={user}>
      <Container maxW="7xl" px={{ base: "4", md: "8" }} py={{ base: "8", md: "12" }}>
        <Stack gap="6">
          <HStack justify="space-between" align="flex-start" gap="4" wrap="wrap">
            <Stack gap="1">
              <Heading as="h1" size="2xl">
                Locations
              </Heading>
              <Text color="fg.muted">Provinces, municipalities and barangays that production data is recorded for.</Text>
            </Stack>
            {can(user, "location:Create") && <LocationFormDialog />}
          </HStack>
          <LocationsTable locations={locations} {...permissions} />
        </Stack>
      </Container>
    </AppShell>
  )
}
