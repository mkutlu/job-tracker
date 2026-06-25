"use client"

import { motion } from "framer-motion"

type Props = {
  data: { name: string; value: number }[]
  total: number
}

export function SourceBars({ data, total }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.62, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-xl border border-border bg-card p-6"
    >
      <h3 className="text-sm font-semibold text-foreground">Top Sources</h3>
      <p className="text-xs text-muted-foreground mt-0.5 mb-5">
        Where your applications come from
      </p>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-32">
          <p className="text-sm text-muted-foreground">No data yet</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {data.map((item) => {
            const pct = total > 0 ? Math.round((item.value / total) * 100) : 0
            return (
              <div key={item.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-foreground">{item.name}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {item.value} · {pct}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
