"use client"

import { Button, Field, Heading, Input, Stack, Text } from "@chakra-ui/react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"
import { z } from "zod"
import { toaster } from "@/components/ui/toaster"
import { Logo } from "@/components/layout/Logo"
import { loginSchema } from "@/types/auth"

type FieldErrors = Partial<Record<"email" | "password", string>>

const INVALID_CREDENTIALS_MESSAGE = "Invalid email or password"

function getErrorMessage(error: string) {
  return error === "CredentialsSignin" ? INVALID_CREDENTIALS_MESSAGE : error
}

export function LoginForm() {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const parsed = loginSchema.safeParse(Object.fromEntries(formData))

    if (!parsed.success) {
      const { fieldErrors: errors } = z.flattenError(parsed.error)
      setFieldErrors({ email: errors.email?.[0], password: errors.password?.[0] })
      return
    }

    setFieldErrors({})
    setIsPending(true)
    const result = await signIn("credentials", { ...parsed.data, redirect: false })

    if (!result?.ok || result.error) {
      setIsPending(false)
      toaster.create({
        type: "error",
        title: "Login failed",
        description: getErrorMessage(result?.error ?? INVALID_CREDENTIALS_MESSAGE),
        closable: true,
      })
      return
    }

    router.replace("/")
    router.refresh()
  }

  return (
    <Stack asChild gap="6" w="full" maxW="sm">
      <form onSubmit={handleSubmit} noValidate>
        <Stack gap="2">
          <Logo />
          <Heading size="2xl">Sign in</Heading>
          <Text color="fg.muted" fontSize="sm">
            Enter your email and password to continue.
          </Text>
        </Stack>

        <Field.Root invalid={!!fieldErrors.email} required>
          <Field.Label>Email</Field.Label>
          <Input name="email" type="email" autoComplete="email" placeholder="you@example.com" />
          <Field.ErrorText>{fieldErrors.email}</Field.ErrorText>
        </Field.Root>

        <Field.Root invalid={!!fieldErrors.password} required>
          <Field.Label>Password</Field.Label>
          <Input name="password" type="password" autoComplete="current-password" />
          <Field.ErrorText>{fieldErrors.password}</Field.ErrorText>
        </Field.Root>

        <Button type="submit" colorPalette="green" loading={isPending} loadingText="Signing in">
          Sign in
        </Button>
      </form>
    </Stack>
  )
}
