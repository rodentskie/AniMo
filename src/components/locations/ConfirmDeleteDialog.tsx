"use client"

import { Button, CloseButton, Dialog, Field, Input, Portal, Stack, Text } from "@chakra-ui/react"
import { useState, type FormEvent, type ReactNode } from "react"

const CONFIRM_WORD = "delete"

interface ConfirmDeleteDialogProps {
  name: string
  trigger: ReactNode
  isPending: boolean
  onConfirm: () => Promise<boolean>
}

export function ConfirmDeleteDialog({ name, trigger, isPending, onConfirm }: ConfirmDeleteDialogProps) {
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const isConfirmed = confirmText.trim().toLowerCase() === CONFIRM_WORD

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isConfirmed) return
    if (await onConfirm()) setOpen(false)
  }

  return (
    <Dialog.Root
      role="alertdialog"
      open={open}
      onOpenChange={(details) => {
        setOpen(details.open)
        if (!details.open) setConfirmText("")
      }}
    >
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content asChild>
            <form onSubmit={handleSubmit} noValidate>
              <Dialog.Header>
                <Dialog.Title>Delete location</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Stack gap="4">
                  <Text>
                    Delete <Text as="span" fontWeight="semibold">{name}</Text>? This can&apos;t be undone.
                  </Text>
                  <Field.Root>
                    <Field.Label>
                      Type <Text as="span" fontWeight="semibold">{CONFIRM_WORD}</Text> to confirm
                    </Field.Label>
                    <Input
                      value={confirmText}
                      onChange={(event) => setConfirmText(event.target.value)}
                      placeholder={CONFIRM_WORD}
                      autoComplete="off"
                      disabled={isPending}
                    />
                  </Field.Root>
                </Stack>
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.ActionTrigger asChild>
                  <Button variant="outline" disabled={isPending}>
                    Cancel
                  </Button>
                </Dialog.ActionTrigger>
                <Button
                  type="submit"
                  colorPalette="red"
                  disabled={!isConfirmed}
                  loading={isPending}
                  loadingText="Deleting"
                >
                  Delete
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
