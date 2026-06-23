"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Briefcase,
  Building2,
  Users,
  Sparkles,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "Overview", href: "/overview", icon: LayoutDashboard },
  { label: "Jobs", href: "/jobs", icon: Briefcase },
  { label: "Companies", href: "/companies", icon: Building2 },
  { label: "Contacts", href: "/contacts", icon: Users },
  { label: "JD Analysis", href: "/analyze", icon: Sparkles },
]

function NavLink({
  href,
  icon: Icon,
  label,
}: {
  href: string
  icon: React.ElementType
  label: string
}) {
  const pathname = usePathname()
  const isActive = pathname === href || (href !== "/" && pathname.startsWith(href))

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
        isActive
          ? "bg-sidebar-primary text-sidebar-primary-foreground"
          : "text-sidebar-muted hover:bg-white/10 hover:text-sidebar-foreground"
      )}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {label}
    </Link>
  )
}

export function Sidebar() {
  return (
    <aside className="flex flex-col w-60 min-h-screen bg-sidebar text-sidebar-foreground shrink-0 border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-sidebar-border">
        <Briefcase className="w-5 h-5 text-sidebar-logo" />
        <span className="font-semibold text-base tracking-tight text-sidebar-foreground">
          Job Tracker
        </span>
      </div>

      {/* Main nav */}
      <nav className="flex flex-col gap-0.5 px-3 py-4 flex-1">
        {navItems.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="px-3 pb-3 border-t border-sidebar-border pt-3">
        <NavLink href="/settings" icon={Settings} label="Settings" />
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-sidebar-border">
        <p className="text-xs text-sidebar-muted">Job Tracker v0.1</p>
      </div>
    </aside>
  )
}
