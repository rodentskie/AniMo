"use client"

import { Avatar, IconButton, Menu, Portal, Text } from "@chakra-ui/react"
import { signOut } from "next-auth/react"
import NextLink from "next/link"
import { LuLogOut } from "react-icons/lu"
import { USER_MENU_ITEMS } from "@/lib/nav"

export interface NavUser {
  fullName: string
  roleNames: string[]
}

interface UserMenuProps {
  user: NavUser
}

export function UserMenu({ user }: UserMenuProps) {
  return (
    <Menu.Root positioning={{ placement: "bottom-end" }}>
      <Menu.Trigger asChild>
        <IconButton aria-label="Open user menu" variant="ghost" size="sm" rounded="full">
          <Avatar.Root size="xs" colorPalette="green">
            <Avatar.Fallback name={user.fullName} />
          </Avatar.Root>
        </IconButton>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content minW="56">
            <Menu.ItemGroup>
              <Menu.ItemGroupLabel>
                <Text fontWeight="semibold" color="fg">
                  {user.fullName}
                </Text>
                <Text fontSize="xs" fontWeight="normal" color="fg.muted">
                  {user.roleNames.length > 0 ? user.roleNames.join(", ") : "No role"}
                </Text>
              </Menu.ItemGroupLabel>
            </Menu.ItemGroup>
            <Menu.Separator />
            {USER_MENU_ITEMS.map((item) => (
              <Menu.Item key={item.href} value={item.href} asChild>
                <NextLink href={item.href}>
                  <item.icon />
                  {item.label}
                </NextLink>
              </Menu.Item>
            ))}
            <Menu.Separator />
            <Menu.Item value="logout" onClick={() => signOut({ callbackUrl: "/login" })}>
              <LuLogOut />
              Log out
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  )
}
