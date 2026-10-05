"use client"

import { chakra, IconButton, Input, InputGroup } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { type FormEvent, useState } from "react"
import { LuArrowRight, LuSearch } from "react-icons/lu"
import { NAV_ITEMS } from "@/lib/nav"

export function SearchBar() {
  const router = useRouter()
  const [query, setQuery] = useState("")

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const term = query.trim().toLowerCase()
    if (!term) return

    const match = NAV_ITEMS.find((item) => item.label.toLowerCase().includes(term))
    if (match) router.push(match.href)
  }

  return (
    <chakra.form onSubmit={handleSubmit} w="full" maxW="md" role="search">
      <InputGroup
        startElement={<LuSearch />}
        endElementProps={{ pointerEvents: "auto" }}
        endElement={
          <IconButton type="submit" aria-label="Go" size="xs" rounded="full" colorPalette="green">
            <LuArrowRight />
          </IconButton>
        }
      >
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Go to Data, Prediction, or Evaluation…"
          aria-label="Search AniMo pages"
          rounded="full"
          bg="bg.panel"
          shadow="sm"
        />
      </InputGroup>
    </chakra.form>
  )
}
