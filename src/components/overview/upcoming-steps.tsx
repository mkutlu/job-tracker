"use client"

import { formatDistanceToNow } from "date-fns"
import { CalendarClock } from "lucide-react"
import { motion } from "framer-motion"
import { JOB_STATUS_CONFIG } from "@/lib/job-types"
import { JobStatus } from "@prisma/client"
import { cn } from "@/lib/utils"

type Item = {
  title: string
  company: string
  status: JobStatus
  date: string
}

export function UpcomingSteps({ items }: { items: Item[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.54, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="border border-border bg-card p-6"
    >
      <div className="flex items-center gap-2 mb-5">
        <CalendarClock size={14} className="text-primary shrink-0" />
        <h3 className="text-sm font-semibold text-foreground">Upcoming Next Steps</h3>
      </div>

      {items.length === 0 ? (
        <div className="flex items-center justify-center h-32">
          <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item, i) => {
            const date = new Date(item.date)
            const now = new Date()
            const isOverdue = date < now
            const isSoon =
              !isOverdue && date.getTime() - now.getTime() < 3 * 24 * 60 * 60 * 1000

            return (
              <div key={i} className="flex items-start gap-3">
                <div
                  className={cn(
                    "w-1.5 h-1.5 rounded-full mt-1.5 shrink-0",
                    isOverdue ? "bg-red-500" : isSoon ? "bg-amber-400" : "bg-primary"
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {item.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-muted-foreground">{item.company}</p>
                    <span className="text-muted-foreground/30">·</span>
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                        JOB_STATUS_CONFIG[item.status].color
                      )}
                    >
                      {JOB_STATUS_CONFIG[item.status].label}
                    </span>
                  </div>
                </div>
                <p
                  className={cn(
                    "text-xs shrink-0 tabular-nums",
                    isOverdue
                      ? "text-red-500 font-medium"
                      : isSoon
                      ? "text-amber-500"
                      : "text-muted-foreground"
                  )}
                >
                  {formatDistanceToNow(date, { addSuffix: true })}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
