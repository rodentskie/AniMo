import { Box, Flex, Grid, Image } from "@chakra-ui/react"
import type { Metadata } from "next"
import NextImage from "next/image"
import { redirect } from "next/navigation"
import { LoginForm } from "@/components/auth/LoginForm"
import { getCurrentUser } from "@/lib/session"

export const metadata: Metadata = {
  title: "Login",
}

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/")

  return (
    <Grid minH="100dvh" bg="bg" templateColumns={{ base: "1fr", lg: "3fr minmax(22rem, 1fr)" }}>
      <Box position="relative" overflow="hidden" display={{ base: "none", lg: "block" }}>
        <Image asChild alt="" objectFit="cover" objectPosition="right bottom" opacity={{ base: "0.9", _dark: "0.75" }}>
          <NextImage src="/ricefields.png" alt="" fill sizes="75vw" priority />
        </Image>
        <Box
          position="absolute"
          inset="0"
          bgGradient="to-r"
          gradientFrom="bg"
          gradientVia="bg/40"
          gradientTo="transparent"
        />
        <Box
          position="absolute"
          inset="0"
          bgGradient="to-t"
          gradientFrom="bg/70"
          gradientVia="transparent"
          gradientTo="bg/20"
        />
      </Box>
      <Flex align="center" justify="center" px={{ base: "4", md: "8" }} py="10">
        <LoginForm />
      </Flex>
    </Grid>
  )
}
