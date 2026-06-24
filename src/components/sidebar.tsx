"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
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

const sidebarVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.055, delayChildren: 0.05 } },
}

const slideIn = {
  hidden: { opacity: 0, x: -14 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
}

function NavLink({
  href,
  icon: Icon,
  label,
  onClose,
}: {
  href: string
  icon: React.ElementType
  label: string
  onClose?: () => void
}) {
  const pathname = usePathname()
  const isActive = pathname === href || (href !== "/" && pathname.startsWith(href))

  return (
    <motion.div variants={slideIn}>
      <Link
        href={href}
        onClick={onClose}
        className={cn(
          "relative flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium group",
          isActive ? "text-sidebar-primary-foreground" : "text-sidebar-muted"
        )}
      >
        {isActive && (
          <motion.div
            layoutId="nav-active-pill"
            className="absolute inset-0 bg-sidebar-primary rounded-md"
            transition={{ type: "spring", stiffness: 500, damping: 40 }}
          />
        )}

        {!isActive && (
          <motion.div
            className="absolute inset-0 rounded-md"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            style={{ background: "rgba(255,255,255,0.07)" }}
          />
        )}

        <motion.span
          className={cn(
            "relative z-10 shrink-0 transition-colors",
            !isActive && "group-hover:text-sidebar-foreground"
          )}
          whileHover={{ scale: 1.2 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <Icon size={16} />
        </motion.span>

        <span
          className={cn(
            "relative z-10 transition-colors",
            !isActive && "group-hover:text-sidebar-foreground"
          )}
        >
          {label}
        </span>
      </Link>
    </motion.div>
  )
}

type SidebarProfile = {
  firstName: string
  lastName: string
  currentTitle?: string | null
  jobStatus: UserJobStatus
  email: string
}

export function Sidebar({ profile, onClose }: { profile: SidebarProfile; onClose?: () => void }) {
  const initials = `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase()
  const subtitle = profile.currentTitle || statusLabel[profile.jobStatus]

  return (
    <motion.aside
      variants={sidebarVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col w-60 min-h-screen bg-sidebar text-sidebar-foreground shrink-0 border-r border-sidebar-border"
    >
      {/* Logo */}
      <motion.div
        variants={slideIn}
        className="flex items-center gap-2 px-6 py-5 border-b border-sidebar-border"
      >
        <motion.div
          initial={{ rotate: -15, scale: 0.7, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.1 }}
        >
          <Briefcase size={18} className="text-sidebar-logo" />
        </motion.div>
        <span className="font-semibold text-base tracking-tight text-sidebar-foreground">
          Job Tracker
        </span>
      </motion.div>

      {/* Main nav */}
      <nav className="flex flex-col gap-0.5 px-3 py-4 flex-1">
        {navItems.map((item) => (
          <NavLink key={item.href} {...item} onClose={onClose} />
        ))}
      </nav>

      {/* Settings */}
      <motion.div variants={slideIn} className="px-3 pb-2">
        <NavLink href="/settings" icon={Settings} label="Settings" onClose={onClose} />
      </motion.div>

      {/* User profile */}
      <motion.div
        variants={slideIn}
        className="px-4 py-4 border-t border-sidebar-border flex items-center gap-3"
      >
        <motion.div
          whileHover={{ scale: 1.08 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center shrink-0 cursor-default"
        >
          <span className="text-xs font-semibold text-sidebar-primary-foreground">
            {initials}
          </span>
        </motion.div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-sidebar-foreground truncate leading-tight">
            {profile.firstName} {profile.lastName}
          </p>
          <p className="text-xs text-sidebar-muted truncate leading-tight mt-0.5">
            {subtitle}
          </p>
        </div>

        <form action={signOut}>
          <motion.button
            type="submit"
            title="Sign out"
            className="text-sidebar-muted p-1 rounded"
            whileHover={{ scale: 1.15, rotate: -8, color: "var(--sidebar-foreground)" }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <LogOut size={15} />
          </motion.button>
        </form>
      </motion.div>
    </motion.aside>
  )
}