import { Box, Container, Flex, Image, Stack, Text } from "@chakra-ui/react"
import NextImage from "next/image"
import { Logo } from "@/components/layout/Logo"
import { GetStartedCard } from "@/components/home/GetStartedCard"
import { MascotGuide } from "@/components/home/MascotGuide"
import { SearchBar } from "@/components/home/SearchBar"

export function Hero() {
  return (
    <Box as="section" position="relative" overflow="hidden" minH="calc(100dvh - 4rem)">
      <Image asChild alt="" position="absolute" inset="0" w="full" h="full" objectFit="cover" objectPosition="right bottom">
        <NextImage src="/ricefields.png" alt="" fill sizes="100vw" priority />
      </Image>
      <Box
        position="absolute"
        inset="0"
        bgGradient={{ base: "to-b", md: "to-r" }}
        gradientFrom="bg"
        gradientVia="bg/80"
        gradientTo="bg/10"
      />

      <Container position="relative" maxW="7xl" px={{ base: "4", md: "8" }} py={{ base: "10", md: "16" }}>
        <Stack gap="6" maxW="xl">
          <Logo size="lg" />
          <Text fontSize={{ base: "md", md: "lg" }} fontWeight="medium">
            An ARIMAX (Autoregressive Integrated Moving Average with Exogenous Variables) Time-Series
            Model for Predicting Rice Yield Trends.
          </Text>
          <Text fontSize="sm" fontWeight="semibold" color={{ base: "green.700", _dark: "green.300" }}>
            Smarter data. Healthier harvests.
          </Text>
          <SearchBar />
        </Stack>

        <Flex
          mt={{ base: "10", md: "20" }}
          direction={{ base: "column", lg: "row" }}
          align={{ base: "stretch", lg: "end" }}
          justify="space-between"
          gap="8"
        >
          <GetStartedCard />
          <Box alignSelf={{ base: "end", lg: "auto" }}>
            <MascotGuide />
          </Box>
        </Flex>
      </Container>
    </Box>
  )
}
