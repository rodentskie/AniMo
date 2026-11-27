import type { IconType } from "react-icons"
import { LuBookOpen, LuChartColumn, LuClipboardCheck, LuHouse, LuSettings, LuTrendingUp } from "react-icons/lu"

export interface NavItem {
  label: string
  href: string
  icon: IconType
  inTopBar: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/", icon: LuHouse, inTopBar: true },
  { label: "Data", href: "/data", icon: LuChartColumn, inTopBar: true },
  { label: "Prediction", href: "/prediction", icon: LuTrendingUp, inTopBar: true },
  { label: "Evaluation", href: "/evaluation", icon: LuClipboardCheck, inTopBar: true },
  { label: "Definition of Terms", href: "/terms", icon: LuBookOpen, inTopBar: false },
  { label: "Settings", href: "/settings", icon: LuSettings, inTopBar: false },
]

export const TOP_BAR_ITEMS = NAV_ITEMS.filter((item) => item.inTopBar)
export const USER_MENU_ITEMS = NAV_ITEMS.filter((item) => !item.inTopBar)

export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}
