"use client"

import { useState, useTransition } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  AlertTriangle, CheckCircle, ShieldAlert, ChevronDown,
  Loader2, FileText, ClipboardPaste, Sparkles,
} from "lucide-react"
import { runAnalysis } from "@/app/actions/analyze"
import type { AnalysisResult, SignalResult } from "@/lib/jd-analyzer"
import type { ClaudeAnalysis } from "@/lib/jd-analyzer-claude"
import { SEMANTIC_SIGNAL_LABELS } from "@/lib/jd-analyzer-claude"
import { cn } from "@/lib/utils"

type SavedJob = {
  id: string
  title: string
  jobDescription: string | null
  company: { name: string }
}

const VERDICT_CONFIG = {
  likely_perm: {
    label: "Likely PERM Filing",
    icon: ShieldAlert,
    color: "text-red-500",
    bg: "bg-red-500/10 border-red-500/30",
    bar: "bg-red-500",
  },
  suspicious: {
    label: "Suspicious",
    icon: AlertTriangle,
    color: "text-amber-500",
    bg: "bg-amber-500/10 border-amber-500/30",
    bar: "bg-amber-500",
  },
  probably_legitimate: {
    label: "Probably Legitimate",
    icon: CheckCircle,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10 border-emerald-500/30",
    bar: "bg-emerald-500",
  },
}

function ScoreBar({ score, verdict }: { score: number; verdict: AnalysisResult["verdict"] }) {
  const cfg = VERDICT_CONFIG[verdict]
  return (
    <div className="flex items-center gap-4">
      <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className={cn("h-full rounded-full", cfg.bar)}
        />
      </div>
      <span className={cn("text-2xl font-bold tabular-nums shrink-0", cfg.color)}>
        {score}
      </span>
    </div>
  )
}

function SignalCard({ signal, index }: { signal: SignalResult; index: number }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className={cn(
        "border transition-colors",
        signal.triggered
          ? "border-red-500/30 bg-red-500/5"
          : "border-border bg-card"
      )}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <div className={cn(
          "w-2 h-2 rounded-full shrink-0",
          signal.triggered ? "bg-red-500" : "bg-emerald-500"
        )} />
        <span className={cn(
          "text-sm font-medium flex-1",
          signal.triggered ? "text-foreground" : "text-muted-foreground"
        )}>
          {signal.label}
        </span>
        <span className={cn(
          "text-xs font-semibold tabular-nums shrink-0 px-2 py-0.5 border",
          signal.triggered
            ? "text-red-500 border-red-500/30 bg-red-500/10"
            : "text-muted-foreground border-border"
        )}>
          +{signal.points} / {signal.maxPoints}
        </span>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.18 }}
          className="text-muted-foreground shrink-0"
        >
          <ChevronDown size={14} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 border-t border-border/50 pt-3 flex flex-col gap-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {signal.description}
              </p>
              {signal.evidence && (
                <p className="text-xs font-mono bg-accent/60 border border-border px-3 py-2 text-foreground break-words">
                  {signal.evidence}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function AnalyzeClient({ savedJobs }: { savedJobs: SavedJob[] }) {
  const [text, setText] = useState("")
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [claudeAnalysis, setClaudeAnalysis] = useState<ClaudeAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleJobSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const job = savedJobs.find((j) => j.id === e.target.value)
    if (job?.jobDescription) setText(job.jobDescription)
  }

  function handleAnalyze() {
    setError(null)
    setClaudeAnalysis(null)
    startTransition(async () => {
      const res = await runAnalysis(text)
      if (res.success) {
        setResult(res.result)
        setClaudeAnalysis(res.claudeAnalysis ?? null)
      } else {
        setError(res.error)
      }
    })
  }

  const verdict = result ? VERDICT_CONFIG[result.verdict] : null
  const triggeredCount = result?.signals.filter((s) => s.triggered).length ?? 0

  return (
    <div className="p-4 sm:p-8 max-w-3xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className="text-2xl font-semibold text-foreground">JD Analysis</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Detect PERM labor certification postings disguised as real job openings
        </p>
      </motion.div>

      {/* Input */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        className="mt-6 flex flex-col gap-3"
      >
        {savedJobs.length > 0 && (
          <div className="flex items-center gap-2">
            <FileText size={14} className="text-muted-foreground shrink-0" />
            <select
              onChange={handleJobSelect}
              defaultValue=""
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60 transition-colors"
            >
              <option value="" disabled>Load from saved application…</option>
              {savedJobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} @ {j.company.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste the full job description here…"
            rows={12}
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60 transition-colors resize-none"
          />
          {text && (
            <button
              onClick={() => { setText(""); setResult(null) }}
              className="absolute top-2 right-2 text-xs text-muted-foreground hover:text-foreground px-2 py-1 hover:bg-accent rounded transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {text.length > 0 ? `${text.length} characters` : "Paste a JD or load from a saved application"}
          </p>
          <button
            onClick={handleAnalyze}
            disabled={isPending || text.trim().length < 50}
            className="flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-5 py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {isPending
              ? <><Loader2 size={14} className="animate-spin" /> Analyzing…</>
              : <><ClipboardPaste size={14} /> Analyze</>
            }
          </button>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </motion.div>

      {/* Results */}
      <AnimatePresence>
        {result && verdict && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 flex flex-col gap-4"
          >
            {/* Verdict card */}
            <div className={cn("border p-5 flex flex-col gap-4", verdict.bg)}>
              <div className="flex items-center gap-3">
                <verdict.icon size={22} className={verdict.color} />
                <div>
                  <p className={cn("text-base font-semibold", verdict.color)}>
                    {verdict.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {triggeredCount} of {result.signals.length} signals triggered
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>PERM likelihood score</span>
                  <span className="font-medium">
                    {result.score < 35 ? "Low" : result.score < 65 ? "Medium" : "High"}
                  </span>
                </div>
                <ScoreBar score={result.score} verdict={result.verdict} />
                <div className="flex justify-between text-[10px] text-muted-foreground/60 mt-0.5">
                  <span>Probably legitimate</span>
                  <span>Suspicious</span>
                  <span>Likely PERM</span>
                </div>
              </div>
            </div>

            {/* Signal breakdown */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Signal breakdown — click to expand
              </p>
              <div className="flex flex-col gap-2">
                {[...result.signals]
                  .sort((a, b) => (b.triggered ? 1 : 0) - (a.triggered ? 1 : 0))
                  .map((signal, i) => (
                    <SignalCard key={signal.id} signal={signal} index={i} />
                  ))}
              </div>
            </div>

            {/* Claude AI section */}
            {claudeAnalysis && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1 }}
                className="flex flex-col gap-3"
              >
                <div className="flex items-center gap-2">
                  <Sparkles size={13} className="text-primary" />
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Claude AI — semantic analysis
                  </p>
                </div>

                {/* Reasoning */}
                <div className="border border-border bg-card px-4 py-3">
                  <p className="text-xs text-muted-foreground leading-relaxed italic">
                    "{claudeAnalysis.reasoning}"
                  </p>
                </div>

                {/* Semantic signals */}
                <div className="flex flex-col gap-2">
                  {claudeAnalysis.semanticSignals.map((sig, i) => {
                    const meta = SEMANTIC_SIGNAL_LABELS[sig.id]
                    return (
                      <div
                        key={sig.id}
                        className={cn(
                          "border px-4 py-3 flex items-start gap-3",
                          sig.triggered
                            ? "border-amber-500/30 bg-amber-500/5"
                            : "border-border bg-card"
                        )}
                      >
                        <div className={cn(
                          "w-2 h-2 rounded-full shrink-0 mt-1",
                          sig.triggered ? "bg-amber-500" : "bg-emerald-500"
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-sm font-medium",
                            sig.triggered ? "text-foreground" : "text-muted-foreground"
                          )}>
                            {meta.label}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{meta.description}</p>
                          {sig.evidence && (
                            <p className="text-xs font-mono bg-accent/60 border border-border px-2 py-1.5 mt-1.5 break-words">
                              {sig.evidence}
                            </p>
                          )}
                        </div>
                        <span className={cn(
                          "text-xs font-semibold shrink-0 px-2 py-0.5 border mt-0.5",
                          sig.triggered
                            ? "text-amber-500 border-amber-500/30 bg-amber-500/10"
                            : "text-muted-foreground border-border"
                        )}>
                          {sig.triggered ? "flagged" : "clear"}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )}

            <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
              This analysis is based on pattern matching and AI inference and is not legal advice.
              Use as one signal among many when evaluating job postings.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
