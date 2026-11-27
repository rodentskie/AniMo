"use client"

import { Button, CloseButton, Dialog, Field, Input, Portal, Stack } from "@chakra-ui/react"
import { useState, useTransition, type FormEvent, type ReactNode } from "react"
import { z } from "zod"
import { LuPlus } from "react-icons/lu"
import { createLocation, updateLocation } from "@/actions/locations"
import { toaster } from "@/components/ui/toaster"
import { locationSchema, type LocationParts } from "@/types/location"

type FieldName = keyof LocationParts
type FieldErrors = Partial<Record<FieldName, string>>

interface LocationFormDialogProps {
  location?: LocationParts & { id: string }
  trigger?: ReactNode
}

const FIELDS: { name: FieldName; label: string; required: boolean }[] = [
  { name: "province", label: "Province", required: true },
  { name: "municipality", label: "Municipality", required: false },
  { name: "barangay", label: "Barangay", required: false },
]

export function LocationFormDialog({ location, trigger }: LocationFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [isPending, startTransition] = useTransition()
  const isEdit = location !== undefined

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsed = locationSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)))
    if (!parsed.success) {
      const { fieldErrors: errors } = z.flattenError(parsed.error)
      setFieldErrors({ province: errors.province?.[0], municipality: errors.municipality?.[0], barangay: errors.barangay?.[0] })
      return
    }

    setFieldErrors({})
    startTransition(async () => {
      const result = isEdit ? await updateLocation(location.id, parsed.data) : await createLocation(parsed.data)
      if (!result.success) {
        toaster.create({ type: "error", title: "Couldn't save location", description: result.error, closable: true })
        return
      }
      toaster.create({ type: "success", title: isEdit ? "Location updated" : "Location added" })
      setOpen(false)
    })
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => {
        setOpen(details.open)
        if (!details.open) setFieldErrors({})
      }}
    >
      <Dialog.Trigger asChild>
        {trigger ?? (
          <Button colorPalette="green">
            <LuPlus />
            Add location
          </Button>
        )}
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content asChild>
            <form onSubmit={handleSubmit} noValidate>
              <Dialog.Header>
                <Dialog.Title>{isEdit ? "Edit location" : "Add location"}</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Stack gap="4">
                  {FIELDS.map((field) => (
                    <Field.Root key={field.name} invalid={!!fieldErrors[field.name]} required={field.required}>
                      <Field.Label>
                        {field.label}
                        <Field.RequiredIndicator />
                      </Field.Label>
                      <Input name={field.name} defaultValue={location?.[field.name] ?? ""} />
                      <Field.ErrorText>{fieldErrors[field.name]}</Field.ErrorText>
                    </Field.Root>
                  ))}
                </Stack>
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.ActionTrigger asChild>
                  <Button variant="outline" disabled={isPending}>
                    Cancel
                  </Button>
                </Dialog.ActionTrigger>
                <Button type="submit" colorPalette="green" loading={isPending} loadingText="Saving">
                  Save
                </Button>
              </Dialog.Footer>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Dialog.CloseTrigger>
            </form>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
