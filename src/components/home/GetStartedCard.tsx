import { Button, Flex, HStack, Image, Text } from "@chakra-ui/react"
import NextImage from "next/image"
import NextLink from "next/link"
import { LuArrowRight } from "react-icons/lu"

export function GetStartedCard() {
  return (
    <Flex
      direction={{ base: "column", sm: "row" }}
      align={{ base: "stretch", sm: "center" }}
      justify="space-between"
      gap="4"
      p="5"
      rounded="2xl"
      bg="bg.panel/90"
      borderWidth="1px"
      shadow="md"
      maxW="lg"
      w="full"
    >
      <HStack gap="3">
        <Image asChild alt="" flexShrink="0">
          <NextImage src="/rice.png" alt="" width={48} height={48} />
        </Image>
        <Text fontSize="sm" color="fg.muted">
          Keen to see how your rice yield is doing?{" "}
          <Text as="span" fontWeight="semibold" color="fg">
            Let&apos;s get started!
          </Text>
        </Text>
      </HStack>
      <Button asChild colorPalette="green" rounded="full" flexShrink="0">
        <NextLink href="#">
          Get Started <LuArrowRight />
        </NextLink>
      </Button>
    </Flex>
  )
}
