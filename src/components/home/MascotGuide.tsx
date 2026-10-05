import { Box, Circle, HStack, Stack, Text } from "@chakra-ui/react"

interface SpeechBubbleProps {
  children: React.ReactNode
}

function SpeechBubble({ children }: SpeechBubbleProps) {
  return (
    <Box
      px="3"
      py="1.5"
      rounded="xl"
      bg="bg.panel"
      borderWidth="1px"
      shadow="sm"
      fontSize="sm"
      fontWeight="medium"
    >
      {children}
    </Box>
  )
}

function Mascot() {
  const earColor = { base: "green.500", _dark: "green.400" }

  return (
    <Box position="relative" w="24" h="24" aria-hidden="true">
      <Box position="absolute" top="-3" left="50%" transform="translateX(-50%)" w="2" h="5" rounded="full" bg={earColor} />
      <Box position="absolute" top="9" left="-1" w="4" h="8" rounded="full" bg={earColor} />
      <Box position="absolute" top="9" right="-1" w="4" h="8" rounded="full" bg={earColor} />
      <Circle size="24" bg="white" borderWidth="2px" borderColor="green.700">
        <HStack justify="center" gap="3" w="16" h="11" rounded="full" bg="gray.900">
          <Box w="2.5" h="4" rounded="full" bg="green.200" />
          <Box w="2.5" h="4" rounded="full" bg="green.200" />
        </HStack>
      </Circle>
    </Box>
  )
}

export function MascotGuide() {
  return (
    <HStack align="end" gap="3">
      <Stack gap="2" align="end">
        <SpeechBubble>Hi! It&apos;s me! I&apos;m AniMo!</SpeechBubble>
        <SpeechBubble>
          <Text as="span" color={{ base: "green.700", _dark: "green.300" }}>
            Your rice yield guide.
          </Text>
        </SpeechBubble>
      </Stack>
      <Mascot />
    </HStack>
  )
}
