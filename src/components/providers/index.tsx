"use client"

import { ThemeProvider } from "next-themes"
import { PaletteProvider } from "./palette-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <PaletteProvider>{children}</PaletteProvider>
    </ThemeProvider>
  )
}
