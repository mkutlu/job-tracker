"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"
import { motion } from "framer-motion"

type Props = {
  data: { week: string; count: number }[]
}

export function ActivityChart({ data }: Props) {
  const hasData = data.some((d) => d.count > 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.38, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-xl border border-border bg-card p-6 flex flex-col"
    >
      <h3 className="text-sm font-semibold text-foreground">Application Activity</h3>
      <p className="text-xs text-muted-foreground mt-0.5 mb-5">
        Applications added over the last 8 weeks
      </p>

      {!hasData ? (
        <div className="flex-1 flex items-center justify-center h-48">
          <p className="text-sm text-muted-foreground">No applications added yet</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ left: -20, right: 4, top: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="var(--primary)" stopOpacity={0.25} />
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              vertical={false}
            />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                fontSize: "12px",
                color: "var(--foreground)",
                boxShadow: "0 4px 12px rgba(0,0,0,.08)",
              }}
              cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
              formatter={(v) => [v, "Applications"]}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="var(--primary)"
              strokeWidth={2}
              fill="url(#activityGradient)"
              dot={false}
              activeDot={{ r: 4, fill: "var(--primary)", strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  )
}
