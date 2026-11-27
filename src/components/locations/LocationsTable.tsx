import { Badge, Table, Text } from "@chakra-ui/react"
import { LocationRowActions } from "@/components/locations/LocationRowActions"
import type { LocationRow } from "@/types/location"

interface LocationsTableProps {
  locations: LocationRow[]
  canUpdate: boolean
  canDelete: boolean
}

function EmptyCell() {
  return <Text color="fg.subtle">—</Text>
}

export function LocationsTable({ locations, canUpdate, canDelete }: LocationsTableProps) {
  const showActions = canUpdate || canDelete

  if (locations.length === 0) {
    return <Text color="fg.muted">No locations yet.</Text>
  }

  return (
    <Table.ScrollArea borderWidth="1px" rounded="md">
      <Table.Root size="sm" interactive>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Province</Table.ColumnHeader>
            <Table.ColumnHeader>Municipality</Table.ColumnHeader>
            <Table.ColumnHeader>Barangay</Table.ColumnHeader>
            <Table.ColumnHeader>Status</Table.ColumnHeader>
            <Table.ColumnHeader textAlign="end">Records</Table.ColumnHeader>
            {showActions && <Table.ColumnHeader textAlign="end">Actions</Table.ColumnHeader>}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {locations.map((location) => (
            <Table.Row key={location.id}>
              <Table.Cell>{location.province}</Table.Cell>
              <Table.Cell>{location.municipality ?? <EmptyCell />}</Table.Cell>
              <Table.Cell>{location.barangay ?? <EmptyCell />}</Table.Cell>
              <Table.Cell>
                <Badge colorPalette={location.isActive ? "green" : "gray"}>
                  {location.isActive ? "Active" : "Inactive"}
                </Badge>
              </Table.Cell>
              <Table.Cell textAlign="end">{location.recordCount}</Table.Cell>
              {showActions && (
                <Table.Cell textAlign="end">
                  <LocationRowActions location={location} canUpdate={canUpdate} canDelete={canDelete} />
                </Table.Cell>
              )}
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  )
}
