"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ShieldAlert, AlertTriangle, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

type PermRow = {
  jobId: string | null
  permScore: number | null
  permVerdict: string | null
  permAnalyzedAt: string | Date | null
  job: {
    id: string
    title: string
    company: { name: string }
  } | null
}

const VERDICT = {
  likely_perm: {
    label: "Likely PERM",
    icon: ShieldAlert,
    color: "text-red-500",
    bg: "bg-red-500/10 border-red-500/20",
    bar: "bg-red-500",
  },
  suspicious: {
    label: "Suspicious",
    icon: AlertTriangle,
    color: "text-amber-500",
    bg: "bg-amber-500/10 border-amber-500/20",
    bar: "bg-amber-500",
  },
  probably_legitimate: {
    label: "Legitimate",
    icon: CheckCircle,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    bar: "bg-emerald-500",
  },
}

function timeAgo(dateStr: string | Date) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return "today"
  if (days === 1) return "yesterday"
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

export function PermAnalysisTable({ rows }: { rows: PermRow[] }) {
  if (rows.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="border border-border bg-card"
    >
      <div className="px-4 py-3 border-b border-border">
        <p className="text-sm font-medium text-foreground">PERM Analysis — Recent</p>
        <p className="text-xs text-muted-foreground mt-0.5">Last {rows.length} analyzed job descriptions</p>
      </div>

      <div className="divide-y divide-border">
        {rows.map((row, i) => {
          if (!row.permScore || !row.permVerdict) return null
          const cfg = VERDICT[row.permVerdict as keyof typeof VERDICT]
          if (!cfg) return null
          const Icon = cfg.icon
          const title = row.job?.title ?? "Deleted job"
          const companyName = row.job?.company.name ?? "—"

          const inner = (
            <>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium truncate", row.job ? "text-foreground" : "text-muted-foreground")}>
                  {title}
                </p>
                <p className="text-xs text-muted-foreground truncate">{companyName}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${row.permScore}%` }}
                    transition={{ duration: 0.6, delay: i * 0.04 + 0.1 }}
                    className={cn("h-full rounded-full", cfg.bar)}
                  />
                </div>
                <span className={cn("text-xs font-semibold tabular-nums w-6 text-right", cfg.color)}>
                  {row.permScore}
                </span>
              </div>
              <div className={cn("flex items-center gap-1 border px-2 py-0.5 shrink-0", cfg.bg)}>
                <Icon size={11} className={cfg.color} />
                <span className={cn("text-[11px] font-medium", cfg.color)}>{cfg.label}</span>
              </div>
              {row.permAnalyzedAt && (
                <span className="text-[11px] text-muted-foreground/60 shrink-0 w-14 text-right">
                  {timeAgo(row.permAnalyzedAt)}
                </span>
              )}
            </>
          )

          return (
            <motion.div
              key={row.jobId ?? i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.22, delay: i * 0.04 }}
            >
              {row.job ? (
                <Link
                  href={`/analyze?jobId=${row.job.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors"
                >
                  {inner}
                </Link>
              ) : (
                <div className="flex items-center gap-3 px-4 py-3 opacity-50">
                  {inner}
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
