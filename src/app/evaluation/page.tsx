import { Container, Heading } from "@chakra-ui/react"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { AppShell } from "@/components/layout/AppShell"
import { getCurrentUser } from "@/lib/session"

export const metadata: Metadata = {
  title: "Evaluation",
}

export default async function EvaluationPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  return (
    <AppShell user={user}>
      <Container maxW="7xl" px={{ base: "4", md: "8" }} py={{ base: "8", md: "12" }}>
        <Heading as="h1" size="2xl">
          Evaluation
        </Heading>
      </Container>
    </AppShell>
  )
}
