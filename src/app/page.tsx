import { Box } from "@chakra-ui/react"
import { Hero } from "@/components/home/Hero"
import { Navbar } from "@/components/layout/Navbar"

export default function Home() {
  return (
    <Box minH="100dvh" bg="bg">
      <Navbar />
      <Box as="main">
        <Hero />
      </Box>
    </Box>
  )
}
