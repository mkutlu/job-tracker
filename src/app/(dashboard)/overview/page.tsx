import { createServerSupabaseClient } from "@/lib/supabase-server"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { JOB_STATUS_CONFIG, SOURCE_LABELS } from "@/lib/job-types"
import { JobStatus, JobSource } from "@prisma/client"
import { ActivityChart } from "@/components/overview/activity-chart"
import { PipelineChart } from "@/components/overview/pipeline-chart"
import { SourceBars } from "@/components/overview/source-bars"
import { UpcomingSteps } from "@/components/overview/upcoming-steps"
import {
  Briefcase,
  TrendingUp,
  MessageSquare,
  Trophy,
  BarChart2,
} from "lucide-react"

// Hex values matching JOB_STATUS_CONFIG colors for use in Recharts SVG
const STATUS_CHART_COLORS: Record<JobStatus, string> = {
  BOOKMARKED:   "#94a3b8",
  APPLYING:     "#60a5fa",
  APPLIED:      "#818cf8",
  PHONE_SCREEN: "#a78bfa",
  INTERVIEW:    "#fbbf24",
  TECHNICAL:    "#fb923c",
  OFFER:        "#34d399",
  ACCEPTED:     "#4ade80",
  REJECTED:     "#f87171",
  WITHDRAWN:    "#a1a1aa",
}

const STATUS_ORDER: JobStatus[] = [
  "BOOKMARKED", "APPLYING", "APPLIED",
  "PHONE_SCREEN", "INTERVIEW", "TECHNICAL",
  "OFFER", "ACCEPTED", "REJECTED", "WITHDRAWN",
]

export default async function OverviewPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const jobs = await prisma.job.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      title: true,
      status: true,
      source: true,
      nextStepAt: true,
      createdAt: true,
      company: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  // ── Stats ─────────────────────────────────────────────────────
  const total = jobs.length
  const active = jobs.filter(
    (j) => !["REJECTED", "WITHDRAWN", "ACCEPTED"].includes(j.status)
  ).length
  const interviews = jobs.filter((j) =>
    ["PHONE_SCREEN", "INTERVIEW", "TECHNICAL"].includes(j.status)
  ).length
  const offers = jobs.filter((j) =>
    ["OFFER", "ACCEPTED"].includes(j.status)
  ).length
  const submitted = jobs.filter(
    (j) => !["BOOKMARKED", "APPLYING"].includes(j.status)
  ).length
  const gotResponse = jobs.filter(
    (j) => !["BOOKMARKED", "APPLYING", "APPLIED"].includes(j.status)
  ).length
  const responseRate =
    submitted > 0 ? Math.round((gotResponse / submitted) * 100) : null

  // ── Pipeline chart ────────────────────────────────────────────
  const pipelineData = STATUS_ORDER.map((s) => ({
    name: JOB_STATUS_CONFIG[s].label,
    value: jobs.filter((j) => j.status === s).length,
    color: STATUS_CHART_COLORS[s],
  })).filter((d) => d.value > 0)

  // ── Weekly activity (last 8 weeks) ────────────────────────────
  const now = new Date()
  const weeklyData = Array.from({ length: 8 }, (_, i) => {
    const start = new Date(now)
    start.setDate(now.getDate() - (7 - i) * 7)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(start.getDate() + 7)
    return {
      week: start.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      count: jobs.filter((j) => {
        const d = new Date(j.createdAt)
        return d >= start && d < end
      }).length,
    }
  })

  // ── Source breakdown ──────────────────────────────────────────
  const sourceCounts = jobs.reduce<Record<string, number>>((acc, j) => {
    const key = j.source ?? "OTHER"
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})
  const sourceData = Object.entries(sourceCounts)
    .map(([source, count]) => ({
      name: SOURCE_LABELS[source as JobSource] ?? "Other",
      value: count,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)

  // ── Upcoming next steps ───────────────────────────────────────
  const upcoming = jobs
    .filter((j) => j.nextStepAt && new Date(j.nextStepAt) > now)
    .sort(
      (a, b) =>
        new Date(a.nextStepAt!).getTime() - new Date(b.nextStepAt!).getTime()
    )
    .slice(0, 6)
    .map((j) => ({
      title: j.title,
      company: j.company.name,
      status: j.status,
      date: j.nextStepAt!.toISOString(),
    }))

  const stats = [
    {
      label: "Total Applied",
      value: total,
      sub: "all time",
      icon: Briefcase,
      accent: true,
    },
    {
      label: "Active",
      value: active,
      sub: "in pipeline",
      icon: TrendingUp,
      accent: false,
    },
    {
      label: "Interviews",
      value: interviews,
      sub: "at any stage",
      icon: MessageSquare,
      accent: false,
    },
    {
      label: "Offers",
      value: offers,
      sub: "received",
      icon: Trophy,
      accent: false,
    },
    ...(responseRate !== null
      ? [
          {
            label: "Response Rate",
            value: `${responseRate}%`,
            sub: "of submitted",
            icon: BarChart2,
            accent: false,
          },
        ]
      : []),
  ]

  return (
    <div className="p-4 sm:p-8 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your job search at a glance
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div
              key={s.label}
              className={
                s.accent
                  ? "col-span-2 sm:col-span-1 rounded-xl p-5 bg-primary text-primary-foreground"
                  : "rounded-xl border border-border bg-card p-5"
              }
            >
              <div className="flex items-center justify-between mb-3">
                <p
                  className={
                    s.accent
                      ? "text-xs font-medium uppercase tracking-widest opacity-70"
                      : "text-xs font-medium uppercase tracking-widest text-muted-foreground"
                  }
                >
                  {s.label}
                </p>
                <Icon
                  size={14}
                  className={
                    s.accent ? "opacity-60" : "text-muted-foreground/50"
                  }
                />
              </div>
              <p
                className={
                  s.accent
                    ? "text-3xl font-bold"
                    : "text-3xl font-bold text-foreground"
                }
              >
                {s.value}
              </p>
              <p
                className={
                  s.accent ? "mt-1 text-xs opacity-60" : "mt-1 text-xs text-muted-foreground"
                }
              >
                {s.sub}
              </p>
            </div>
          )
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <ActivityChart data={weeklyData} />
        </div>
        <div className="lg:col-span-2">
          <PipelineChart data={pipelineData} />
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <UpcomingSteps items={upcoming} />
        <SourceBars data={sourceData} total={total} />
      </div>
    </div>
  )
}
