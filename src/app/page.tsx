import { Box } from "@chakra-ui/react"
import { redirect } from "next/navigation"
import { Hero } from "@/components/home/Hero"
import { Navbar } from "@/components/layout/Navbar"
import { getCurrentUser } from "@/lib/session"

export default async function Home() {
  if (!(await getCurrentUser())) redirect("/login")

  return (
    <Box minH="100dvh" bg="bg">
      <Navbar />
      <Box as="main">
        <Hero />
      </Box>
    </Box>
  )
}
