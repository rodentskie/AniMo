"use client"

import { HStack, IconButton } from "@chakra-ui/react"
import { useTransition } from "react"
import { LuPencil, LuPower, LuPowerOff, LuTrash2 } from "react-icons/lu"
import { deleteLocation, setLocationActive } from "@/actions/locations"
import { ConfirmDeleteDialog } from "@/components/locations/ConfirmDeleteDialog"
import { LocationFormDialog } from "@/components/locations/LocationFormDialog"
import { toaster } from "@/components/ui/toaster"
import { formatLocation } from "@/lib/location"
import type { ActionResult, LocationRow } from "@/types/location"

interface LocationRowActionsProps {
  location: LocationRow
  canUpdate: boolean
  canDelete: boolean
}

export function LocationRowActions({ location, canUpdate, canDelete }: LocationRowActionsProps) {
  const [isPending, startTransition] = useTransition()
  const name = formatLocation(location)

  function run(action: () => Promise<ActionResult<unknown>>, successTitle: string): Promise<boolean> {
    return new Promise((resolve) => {
      startTransition(async () => {
        const result = await action()
        if (!result.success) {
          toaster.create({ type: "error", title: "Action failed", description: result.error, closable: true })
          resolve(false)
          return
        }
        toaster.create({ type: "success", title: successTitle, description: name })
        resolve(true)
      })
    })
  }

  return (
    <HStack gap="1" justify="flex-end">
      {canUpdate && (
        <>
          <LocationFormDialog
            location={location}
            trigger={
              <IconButton aria-label={`Edit ${name}`} size="xs" variant="ghost" disabled={isPending}>
                <LuPencil />
              </IconButton>
            }
          />
          <IconButton
            aria-label={location.isActive ? `Deactivate ${name}` : `Activate ${name}`}
            title={location.isActive ? "Deactivate" : "Activate"}
            size="xs"
            variant="ghost"
            disabled={isPending}
            onClick={() =>
              run(
                () => setLocationActive(location.id, !location.isActive),
                location.isActive ? "Location deactivated" : "Location activated",
              )
            }
          >
            {location.isActive ? <LuPowerOff /> : <LuPower />}
          </IconButton>
        </>
      )}
      {canDelete && !location.hasHistory && (
        <ConfirmDeleteDialog
          name={name}
          isPending={isPending}
          onConfirm={() => run(() => deleteLocation(location.id), "Location deleted")}
          trigger={
            <IconButton
              aria-label={`Delete ${name}`}
              title="Delete"
              size="xs"
              variant="ghost"
              colorPalette="red"
              disabled={isPending}
            >
              <LuTrash2 />
            </IconButton>
          }
        />
      )}
    </HStack>
  )
}
