import { createServerSupabaseClient } from "@/lib/supabase-server"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { JOB_STATUS_CONFIG, SOURCE_LABELS } from "@/lib/job-types"
import { JobStatus, JobSource } from "@prisma/client"
import { ActivityChart } from "@/components/overview/activity-chart"
import { PipelineChart } from "@/components/overview/pipeline-chart"
import { SourceBars } from "@/components/overview/source-bars"
import { UpcomingSteps } from "@/components/overview/upcoming-steps"
import { StatCards } from "@/components/overview/stat-cards"
import type { StatDef } from "@/components/overview/stat-cards"
import { PermAnalysisTable } from "@/components/overview/perm-analysis-table"
import { getRecentPermAnalyses } from "@/app/actions/analyze"

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

function pct(n: number, d: number) {
  return d > 0 ? Math.round((n / d) * 100) : 0
}

export default async function OverviewPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [jobs, recentAnalyses] = await Promise.all([
    prisma.job.findMany({
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
    }),
    getRecentPermAnalyses(),
  ])

  // ── Stats ─────────────────────────────────────────────────────
  const now = new Date()
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
  const responseRate = submitted > 0 ? pct(gotResponse, submitted) : null

  const weekAgo = new Date(now)
  weekAgo.setDate(weekAgo.getDate() - 7)
  const thisWeek = jobs.filter((j) => new Date(j.createdAt) >= weekAgo).length

  const stats: StatDef[] = [
    {
      variant: "total",
      label: "Applications",
      value: total,
      sub: thisWeek > 0 ? `+${thisWeek} this week` : "all time",
    },
    {
      variant: "active",
      label: "Active",
      value: active,
      sub: total > 0 ? `${pct(active, total)}% of total` : "in pipeline",
    },
    {
      variant: "interviews",
      label: "Interviews",
      value: interviews,
      sub: active > 0 ? `${pct(interviews, active)}% of active` : "at any stage",
    },
    {
      variant: "offers",
      label: "Offers",
      value: offers,
      sub: interviews > 0 ? `${pct(offers, interviews)}% of interviews` : "received",
    },
    ...(responseRate !== null
      ? ([
          {
            variant: "responseRate",
            label: "Response Rate",
            value: responseRate,
            isPercent: true,
            sub: `of ${submitted} submitted`,
          },
        ] satisfies StatDef[])
      : []),
  ]

  // ── Pipeline chart ────────────────────────────────────────────
  const pipelineData = STATUS_ORDER.map((s) => ({
    name: JOB_STATUS_CONFIG[s].label,
    value: jobs.filter((j) => j.status === s).length,
    color: STATUS_CHART_COLORS[s],
  })).filter((d) => d.value > 0)

  // ── Weekly activity (last 8 weeks) ────────────────────────────
  const weeklyData = Array.from({ length: 8 }, (_, i) => {
    const start = new Date(now)
    start.setDate(now.getDate() - (7 - i) * 7)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(start.getDate() + 7)
    return {
      week: start.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
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

  return (
    <div className="p-4 sm:p-8 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your job search at a glance
        </p>
      </div>

      <StatCards stats={stats} />

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

      {recentAnalyses.length > 0 && (
        <PermAnalysisTable rows={recentAnalyses as Parameters<typeof PermAnalysisTable>[0]["rows"]} />
      )}
    </div>
  )
}
