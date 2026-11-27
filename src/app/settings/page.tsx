import { Card, Container, Heading, Icon, LinkOverlay, SimpleGrid, Stack, Text } from "@chakra-ui/react"
import type { Metadata } from "next"
import NextLink from "next/link"
import { redirect } from "next/navigation"
import { LuMapPin } from "react-icons/lu"
import { AppShell } from "@/components/layout/AppShell"
import { can } from "@/lib/guards"
import { getCurrentUser } from "@/lib/session"

export const metadata: Metadata = {
  title: "Settings",
}

export default async function SettingsPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  return (
    <AppShell user={user}>
      <Container maxW="7xl" px={{ base: "4", md: "8" }} py={{ base: "8", md: "12" }}>
        <Stack gap="6">
          <Heading as="h1" size="2xl">
            Settings
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="4">
            {can(user, "location:Read") && (
              <Card.Root position="relative" variant="outline" _hover={{ borderColor: "green.solid" }}>
                <Card.Body gap="2">
                  <Icon boxSize="6" color="green.fg">
                    <LuMapPin />
                  </Icon>
                  <Card.Title>
                    <LinkOverlay asChild>
                      <NextLink href="/settings/locations">Locations</NextLink>
                    </LinkOverlay>
                  </Card.Title>
                  <Text color="fg.muted" fontSize="sm">
                    Manage the provinces, municipalities and barangays used for production data.
                  </Text>
                </Card.Body>
              </Card.Root>
            )}
          </SimpleGrid>
        </Stack>
      </Container>
    </AppShell>
  )
}
