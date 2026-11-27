import { Box } from "@chakra-ui/react"
import { Navbar } from "@/components/layout/Navbar"
import type { CurrentUser } from "@/types/iam"

interface AppShellProps {
  user: CurrentUser
  children: React.ReactNode
}

export function AppShell({ user, children }: AppShellProps) {
  const navUser = {
    fullName: `${user.firstName} ${user.lastName}`,
    roleNames: user.roleNames,
  }

  return (
    <Box minH="100dvh" bg="bg">
      <Navbar user={navUser} />
      <Box as="main">{children}</Box>
    </Box>
  )
}
