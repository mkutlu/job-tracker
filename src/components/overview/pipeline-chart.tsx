"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { motion } from "framer-motion"

type Props = {
  data: { name: string; value: number; color: string }[]
}

export function PipelineChart({ data }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.46, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="border border-border bg-card p-6 flex flex-col"
    >
      <h3 className="text-sm font-semibold text-foreground">Pipeline Breakdown</h3>
      <p className="text-xs text-muted-foreground mt-0.5 mb-5">
        Applications by current stage
      </p>

      {data.length === 0 ? (
        <div className="flex-1 flex items-center justify-center h-48">
          <p className="text-sm text-muted-foreground">No applications yet</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ left: 0, right: 24, top: 0, bottom: 0 }}
          >
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              width={88}
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
              cursor={{ fill: "var(--accent)" }}
              formatter={(v) => [v, "Applications"]}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  )
}
