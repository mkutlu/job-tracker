export type PaletteName =
  | "espresso"
  | "cognac"
  | "amber"
  | "rust"
  | "forest"
  | "abyss"
  | "slate-violet"
  | "midnight-indigo"
  | "steel-blue"

export interface Palette {
  name: PaletteName
  label: string
  description: string
  sidebarColor: string
  primaryColor: string
}

export const PALETTES: Palette[] = [
  {
    name: "espresso",
    label: "Espresso",
    description: "Warm espresso with terracotta",
    sidebarColor: "#1C1410",
    primaryColor: "#C05B30",
  },
  {
    name: "cognac",
    label: "Cognac",
    description: "Deep wine-black with burgundy",
    sidebarColor: "#160A0C",
    primaryColor: "#8A3428",
  },
  {
    name: "amber",
    label: "Amber",
    description: "Dark espresso with golden copper",
    sidebarColor: "#1A1208",
    primaryColor: "#B8720A",
  },
  {
    name: "rust",
    label: "Rust",
    description: "Near-black with rust-sienna",
    sidebarColor: "#1C1008",
    primaryColor: "#A0391A",
  },
  {
    name: "forest",
    label: "Forest",
    description: "Deep forest green with sage",
    sidebarColor: "#0F1F12",
    primaryColor: "#2D6A35",
  },
  {
    name: "abyss",
    label: "Abyss",
    description: "Dark ocean with bright teal",
    sidebarColor: "#061419",
    primaryColor: "#0B6E72",
  },
  {
    name: "slate-violet",
    label: "Slate Violet",
    description: "Dark zinc with violet",
    sidebarColor: "#18181B",
    primaryColor: "#7C3AED",
  },
  {
    name: "midnight-indigo",
    label: "Midnight Indigo",
    description: "Near-black with indigo",
    sidebarColor: "#020617",
    primaryColor: "#6366F1",
  },
  {
    name: "steel-blue",
    label: "Steel Blue",
    description: "Dark slate with sky blue",
    sidebarColor: "#0F172A",
    primaryColor: "#0284C7",
  },
]

export const DEFAULT_PALETTE: PaletteName = "espresso"
