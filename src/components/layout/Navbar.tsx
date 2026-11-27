"use client"

import {
  Box,
  Flex,
  HStack,
  IconButton,
  Link as ChakraLink,
  Menu,
  Portal,
} from "@chakra-ui/react"
import NextLink from "next/link"
import { usePathname } from "next/navigation"
import { LuMenu } from "react-icons/lu"
import { ColorModeButton } from "@/components/ui/color-mode"
import { Logo } from "@/components/layout/Logo"
import { UserMenu, type NavUser } from "@/components/layout/UserMenu"
import { isActivePath, NAV_ITEMS, TOP_BAR_ITEMS } from "@/lib/nav"

interface NavbarProps {
  user: NavUser
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname()
  const currentPage = (href: string) => (isActivePath(pathname, href) ? "page" : undefined)

  return (
    <Box
      as="header"
      position="sticky"
      top="0"
      zIndex="sticky"
      bg="bg/90"
      backdropFilter="blur(8px)"
      borderBottomWidth="1px"
    >
      <Flex maxW="7xl" mx="auto" px={{ base: "4", md: "8" }} h="16" align="center" justify="space-between">
        <NextLink href="/" aria-label="AniMo home">
          <Logo />
        </NextLink>

        <HStack as="nav" gap="8" hideBelow="md">
          {TOP_BAR_ITEMS.map((item) => (
            <ChakraLink
              key={item.href}
              asChild
              fontSize="sm"
              fontWeight="medium"
              color="fg.muted"
              pb="1"
              borderBottomWidth="2px"
              borderColor="transparent"
              _hover={{ color: "fg", textDecoration: "none" }}
              _currentPage={{
                color: { base: "green.700", _dark: "green.300" },
                borderColor: { base: "green.700", _dark: "green.300" },
              }}
            >
              <NextLink href={item.href} aria-current={currentPage(item.href)}>
                {item.label}
              </NextLink>
            </ChakraLink>
          ))}
        </HStack>

        <HStack gap="1">
          <ColorModeButton />
          <UserMenu user={user} />
          <Menu.Root>
            <Menu.Trigger asChild>
              <IconButton aria-label="Open menu" variant="ghost" size="sm" hideFrom="md">
                <LuMenu />
              </IconButton>
            </Menu.Trigger>
            <Portal>
              <Menu.Positioner>
                <Menu.Content>
                  {NAV_ITEMS.map((item) => (
                    <Menu.Item
                      key={item.href}
                      value={item.href}
                      asChild
                      _currentPage={{ color: { base: "green.700", _dark: "green.300" }, fontWeight: "semibold" }}
                    >
                      <NextLink href={item.href} aria-current={currentPage(item.href)}>
                        <item.icon />
                        {item.label}
                      </NextLink>
                    </Menu.Item>
                  ))}
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>
        </HStack>
      </Flex>
    </Box>
  )
}
