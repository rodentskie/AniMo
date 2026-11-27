import { Button, Flex, Heading, Stack, Text } from "@chakra-ui/react"
import type { Metadata } from "next"
import NextLink from "next/link"
import { Logo } from "@/components/layout/Logo"

export const metadata: Metadata = {
  title: "Access denied",
}

export default function Forbidden() {
  return (
    <Flex minH="100dvh" bg="bg" align="center" justify="center" px="4">
      <Stack gap="5" maxW="md" align="center" textAlign="center">
        <Logo size="lg" />
        <Heading size="2xl">You don&apos;t have access to this page</Heading>
        <Text color="fg.muted">
          Your account doesn&apos;t have permission to view this. If you think this is a mistake, ask an administrator
          to update your role.
        </Text>
        <Button asChild colorPalette="green">
          <NextLink href="/">Back to home</NextLink>
        </Button>
      </Stack>
    </Flex>
  )
}
