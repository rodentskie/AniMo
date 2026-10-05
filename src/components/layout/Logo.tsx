import { HStack, Image, Text } from "@chakra-ui/react"
import NextImage from "next/image"

interface LogoProps {
  size?: "sm" | "lg"
}

export function Logo({ size = "sm" }: LogoProps) {
  const isLarge = size === "lg"
  const iconSize = isLarge ? 72 : 32

  return (
    <HStack gap={isLarge ? "3" : "1.5"}>
      <Image asChild alt="">
        <NextImage src="/rice.png" alt="" width={iconSize} height={iconSize} priority />
      </Image>
      <Text
        as="span"
        fontWeight="extrabold"
        letterSpacing="tight"
        fontSize={isLarge ? { base: "5xl", md: "6xl" } : "xl"}
        color={{ base: "green.800", _dark: "green.200" }}
      >
        AniMo
      </Text>
    </HStack>
  )
}
