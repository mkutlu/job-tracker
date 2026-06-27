import { anthropic } from "@ai-sdk/anthropic"
import { generateObject } from "ai"
import { z } from "zod"
import type { SignalResult } from "./jd-analyzer"

const SemanticSignalSchema = z.object({
  id: z.enum([
    "vague_location",
    "salary_precision",
    "no_company_personality",
    "passive_impersonal_tone",
    "artificially_narrow",
  ]),
  triggered: z.boolean(),
  evidence: z.string().nullable(),
})

const ClaudeAnalysisSchema = z.object({
  semanticSignals: z.array(SemanticSignalSchema),
  claudeVerdict: z.enum(["likely_perm", "suspicious", "probably_legitimate"]),
  claudeScore: z.number().min(0).max(100),
  reasoning: z.string(),
})

export type SemanticSignal = z.infer<typeof SemanticSignalSchema>
export type ClaudeAnalysis = z.infer<typeof ClaudeAnalysisSchema>

export const SEMANTIC_SIGNAL_LABELS: Record<SemanticSignal["id"], { label: string; description: string }> = {
  vague_location: {
    label: "Vague work location",
    description: "Location listed as 'client sites' or similar without a city/state, a PERM-filing pattern.",
  },
  salary_precision: {
    label: "DOL-style salary precision",
    description: "Salary cited as a single exact number (not a range), consistent with a prevailing wage determination.",
  },
  no_company_personality: {
    label: "No employer branding",
    description: "No mission, culture, benefits, or 'why work here' language — reads like a form, not a pitch.",
  },
  passive_impersonal_tone: {
    label: "Passive / impersonal tone",
    description: "'Applicant must', 'candidate shall' — passive legal-draft language instead of conversational recruiting.",
  },
  artificially_narrow: {
    label: "Artificially narrow requirements",
    description: "Exact years (e.g., '7 years', not '5+') or hyper-specific field combinations designed to exclude all but one person.",
  },
}

function buildPrompt(jdText: string, triggeredSignals: SignalResult[]): string {
  const triggeredSummary =
    triggeredSignals.length > 0
      ? triggeredSignals.map((s) => `- ${s.label}: ${s.evidence ?? "triggered"}`).join("\n")
      : "None"

  return `You are an expert in US immigration labor law, specifically PERM labor certification.

PERM (Program Electronic Review Management) is a DOL application required for an employer-sponsored Green Card. Companies sometimes post "dummy" job descriptions as part of the PERM process. These are NOT real openings — they are written narrowly to match one specific foreign worker's existing profile so no qualified US worker can be found.

A rule-based engine has already scanned this JD. Your job is to add semantic and tonal analysis that regex cannot catch.

RULE ENGINE FINDINGS (triggered signals):
${triggeredSummary}

JOB DESCRIPTION:
---
${jdText.slice(0, 3000)}
---

Evaluate these FIVE semantic signals:

1. vague_location — Work location is vague ("client sites", "various unanticipated locations", no specific city/state)
2. salary_precision — Salary listed as a single exact dollar amount with no range (suggests DOL prevailing wage)
3. no_company_personality — No employer branding: no mission, team culture, benefits, or reason to apply
4. passive_impersonal_tone — Written in passive/third-person throughout ("applicant must", "candidate shall") rather than inviting tone
5. artificially_narrow — Exact years experience (not "5+") or hyper-specific tech combinations designed to exclude

For claudeScore: factor in both what the rule engine found and what you see semantically.
  - 0–34: probably legitimate
  - 35–64: suspicious
  - 65–100: likely PERM

For reasoning: 2 sentences maximum. Be direct about the top indicators.`
}

export async function analyzeJDWithClaude(
  jdText: string,
  triggeredSignals: SignalResult[],
): Promise<ClaudeAnalysis | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null

  try {
    const { object } = await generateObject({
      model: anthropic("claude-3-5-haiku-20241022"),
      schema: ClaudeAnalysisSchema,
      prompt: buildPrompt(jdText, triggeredSignals),
    })
    return object
  } catch (err) {
    console.error("[jd-analyzer-claude] API call failed:", err)
    return null
  }
}
