import * as React from "react"
import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"

const LIGHT_MODE_ENABLED = false

export function DarkModeToggle() {
  const [theme, setThemeState] = React.useState<"theme-light" | "dark" | "system">("dark")

  React.useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains("dark")
    setThemeState(isDarkMode ? "dark" : "theme-light")
  }, [])

  React.useEffect(() => {
    const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
    document.documentElement.classList[isDark ? "add" : "remove"]("dark")
  }, [theme])

  const nextTheme = () => {
    return theme === "theme-light" ? "dark" : "theme-light"
  }

  return !LIGHT_MODE_ENABLED ? null : (
    <Button variant="outline" size="icon" onClick={() => setThemeState(nextTheme())}>
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
