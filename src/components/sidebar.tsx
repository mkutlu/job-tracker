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
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { signOut } from "@/app/actions/auth"
import { UserJobStatus } from "@prisma/client"

const navItems = [
  { label: "Overview",    href: "/overview",  icon: LayoutDashboard },
  { label: "Jobs",        href: "/jobs",       icon: Briefcase },
  { label: "Companies",   href: "/companies",  icon: Building2 },
  { label: "Contacts",    href: "/contacts",   icon: Users },
  { label: "JD Analysis", href: "/analyze",    icon: Sparkles },
]

const statusLabel: Record<UserJobStatus, string> = {
  EMPLOYED:   "Currently employed",
  UNEMPLOYED: "Open to work",
  FREELANCE:  "Freelancing",
  STUDENT:    "Student",
}

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
      <Icon size={16} />
      {label}
    </Link>
  )
}

type SidebarProfile = {
  firstName: string
  lastName: string
  currentTitle?: string
  jobStatus: UserJobStatus
  email: string
}

export function Sidebar({ profile }: { profile: SidebarProfile }) {
  const initials = `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase()
  const subtitle = profile.currentTitle || statusLabel[profile.jobStatus]

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-sidebar text-sidebar-foreground shrink-0 border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-sidebar-border">
        <Briefcase size={18} className="text-sidebar-logo" />
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

      {/* Settings */}
      <div className="px-3 pb-2">
        <NavLink href="/settings" icon={Settings} label="Settings" />
      </div>

      {/* User profile */}
      <div className="px-4 py-4 border-t border-sidebar-border flex items-center gap-3">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center shrink-0">
          <span className="text-xs font-semibold text-sidebar-primary-foreground">
            {initials}
          </span>
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-sidebar-foreground truncate leading-tight">
            {profile.firstName} {profile.lastName}
          </p>
          <p className="text-xs text-sidebar-muted truncate leading-tight mt-0.5">
            {subtitle}
          </p>
        </div>

        {/* Logout */}
        <form action={signOut}>
          <button
            type="submit"
            title="Sign out"
            className="text-sidebar-muted hover:text-sidebar-foreground transition-colors p-1 rounded"
          >
            <LogOut size={15} />
          </button>
        </form>
      </div>
    </aside>
  )
}
