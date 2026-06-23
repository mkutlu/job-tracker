"use client"

import { useTheme } from "next-themes"
import { usePalette } from "@/components/providers/palette-provider"
import { PALETTES } from "@/lib/themes"
import { Check, Monitor, Moon, Sun } from "lucide-react"
import { cn } from "@/lib/utils"

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
]

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { palette, setPalette } = usePalette()

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your preferences</p>
      </div>

      <section>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">
          Appearance
        </p>

        <div className="rounded-xl border border-border bg-card p-6 space-y-6">

          {/* Theme mode */}
          <div>
            <p className="text-sm font-medium text-card-foreground mb-1">Theme</p>
            <p className="text-xs text-muted-foreground mb-3">Choose your preferred color mode</p>
            <div className="flex gap-2">
              {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border",
                    theme === value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:text-foreground hover:border-ring"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Color palette */}
          <div>
            <p className="text-sm font-medium text-card-foreground mb-1">Color palette</p>
            <p className="text-xs text-muted-foreground mb-4">
              Choose a color scheme for the interface
            </p>
            <div className="grid grid-cols-3 gap-2">
              {PALETTES.map((p) => {
                const isActive = palette === p.name
                return (
                  <button
                    key={p.name}
                    onClick={() => setPalette(p.name)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border text-left transition-colors",
                      isActive
                        ? "border-ring bg-accent"
                        : "border-border bg-background hover:bg-muted"
                    )}
                  >
                    <div className="flex gap-1 shrink-0">
                      <span
                        className="w-4 h-4 rounded-full block"
                        style={{ background: p.sidebarColor }}
                      />
                      <span
                        className="w-4 h-4 rounded-full block"
                        style={{ background: p.primaryColor }}
                      />
                    </div>
                    <span className="flex-1 min-w-0 text-xs font-medium text-foreground truncate">
                      {p.label}
                    </span>
                    {isActive && (
                      <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

        </div>
      </section>
    </div>
  )
}
