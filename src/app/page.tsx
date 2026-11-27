import { redirect } from "next/navigation"
import { Hero } from "@/components/home/Hero"
import { AppShell } from "@/components/layout/AppShell"
import { getCurrentUser } from "@/lib/session"

export default async function Home() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  return (
    <AppShell user={user}>
      <Hero />
    </AppShell>
  )
}
