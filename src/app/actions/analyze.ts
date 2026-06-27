"use server"

import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { prisma } from "@/lib/prisma"
import { analyzeJD } from "@/lib/jd-analyzer"
import { analyzeJDWithClaude } from "@/lib/jd-analyzer-claude"

export async function getSavedJobsForAnalysis() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  return prisma.job.findMany({
    where: { userId: user.id, jobDescription: { not: null } },
    select: {
      id: true,
      title: true,
      jobDescription: true,
      company: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function runAnalysis(text: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const trimmed = text?.trim()
  if (!trimmed || trimmed.length < 50) {
    return { success: false as const, error: "Please provide a job description (at least 50 characters)." }
  }

  const result = analyzeJD(trimmed)
  const triggeredSignals = result.signals.filter((s) => s.triggered)
  const claudeAnalysis = await analyzeJDWithClaude(trimmed, triggeredSignals)

  const combinedScore = claudeAnalysis
    ? Math.round(result.score * 0.6 + claudeAnalysis.claudeScore * 0.4)
    : result.score

  const combinedVerdict =
    combinedScore >= 65 ? "likely_perm" as const
    : combinedScore >= 35 ? "suspicious" as const
    : "probably_legitimate" as const

  return { success: true as const, result, claudeAnalysis, combinedScore, combinedVerdict }
}
