"use client"

import { useEffect } from "react"
import { useMotionValue, useTransform, animate, motion } from "framer-motion"
import {
  Briefcase,
  TrendingUp,
  MessageSquare,
  Trophy,
  BarChart2,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Each variant maps to full static Tailwind class strings so JIT never purges them
const VARIANT_CONFIG = {
  total: {
    gradient: "from-primary/8",
    accent: "bg-primary",
    icon: Briefcase,
    iconClass: "text-primary",
  },
  active: {
    gradient: "from-blue-500/8",
    accent: "bg-blue-500",
    icon: TrendingUp,
    iconClass: "text-blue-500",
  },
  interviews: {
    gradient: "from-amber-500/8",
    accent: "bg-amber-500",
    icon: MessageSquare,
    iconClass: "text-amber-500",
  },
  offers: {
    gradient: "from-emerald-500/8",
    accent: "bg-emerald-500",
    icon: Trophy,
    iconClass: "text-emerald-500",
  },
  responseRate: {
    gradient: "from-violet-500/8",
    accent: "bg-violet-500",
    icon: BarChart2,
    iconClass: "text-violet-500",
  },
} as const

export type StatVariant = keyof typeof VARIANT_CONFIG

export type StatDef = {
  variant: StatVariant
  label: string
  value: number
  isPercent?: boolean
  sub: string
}

function CountUp({
  value,
  isPercent,
}: {
  value: number
  isPercent?: boolean
}) {
  const count = useMotionValue(0)
  const display = useTransform(count, (v) =>
    isPercent ? `${Math.round(v)}%` : Math.round(v).toLocaleString()
  )

  useEffect(() => {
    const controls = animate(count, value, {
      duration: 1.1,
      ease: [0.16, 1, 0.3, 1],
    })
    return controls.stop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return <motion.span>{display}</motion.span>
}

export function StatCards({ stats }: { stats: StatDef[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {stats.map((stat, i) => {
        const cfg = VARIANT_CONFIG[stat.variant]
        const Icon = cfg.icon

        return (
          <motion.div
            key={stat.variant}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: i * 0.08,
              duration: 0.45,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="relative overflow-hidden rounded-xl border border-border bg-card p-5"
          >
            {/* Gradient tint overlay — unique color per metric */}
            <div
              className={cn(
                "pointer-events-none absolute inset-0 bg-gradient-to-br",
                cfg.gradient
              )}
            />

            {/* Top accent stripe */}
            <div className={cn("absolute inset-x-0 top-0 h-[2px]", cfg.accent)} />

            {/* Watermark icon — large, ghosted, bottom-right */}
            <div
              className={cn(
                "pointer-events-none absolute -right-3 -bottom-3 opacity-[0.065]",
                cfg.iconClass
              )}
            >
              <Icon size={92} strokeWidth={1.25} />
            </div>

            {/* Label */}
            <p className="relative z-10 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              {stat.label}
            </p>

            {/* Animated number */}
            <p className="relative z-10 mt-3 text-5xl font-black leading-none tracking-tight text-foreground">
              <CountUp value={stat.value} isPercent={stat.isPercent} />
            </p>

            {/* Sub stat / context */}
            <p className="relative z-10 mt-2 text-xs text-muted-foreground">
              {stat.sub}
            </p>
          </motion.div>
        )
      })}
    </div>
  )
}
