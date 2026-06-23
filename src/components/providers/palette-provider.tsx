"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { DEFAULT_PALETTE, type PaletteName } from "@/lib/themes"

interface PaletteContextValue {
  palette: PaletteName
  setPalette: (palette: PaletteName) => void
}

const PaletteContext = createContext<PaletteContextValue>({
  palette: DEFAULT_PALETTE,
  setPalette: () => {},
})

export function PaletteProvider({ children }: { children: React.ReactNode }) {
  const [palette, setPaletteState] = useState<PaletteName>(DEFAULT_PALETTE)

  useEffect(() => {
    const stored = localStorage.getItem("palette") as PaletteName | null
    if (stored) setPaletteState(stored)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute("data-palette", palette)
    localStorage.setItem("palette", palette)
  }, [palette])

  return (
    <PaletteContext.Provider value={{ palette, setPalette: setPaletteState }}>
      {children}
    </PaletteContext.Provider>
  )
}

export const usePalette = () => useContext(PaletteContext)
