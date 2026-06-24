import { JobStatus, Priority, JobSource, LocationType } from "@prisma/client"

export const JOB_STATUS_CONFIG: Record<JobStatus, { label: string; color: string }> = {
  BOOKMARKED:   { label: "Bookmarked",   color: "bg-slate-500/15 text-slate-600" },
  APPLYING:     { label: "Applying",     color: "bg-blue-500/15 text-blue-600" },
  APPLIED:      { label: "Applied",      color: "bg-indigo-500/15 text-indigo-600" },
  PHONE_SCREEN: { label: "Phone Screen", color: "bg-violet-500/15 text-violet-600" },
  INTERVIEW:    { label: "Interview",    color: "bg-amber-500/15 text-amber-600" },
  TECHNICAL:    { label: "Technical",    color: "bg-orange-500/15 text-orange-600" },
  OFFER:        { label: "Offer",        color: "bg-emerald-500/15 text-emerald-700" },
  ACCEPTED:     { label: "Accepted",     color: "bg-green-500/15 text-green-700" },
  REJECTED:     { label: "Rejected",     color: "bg-red-500/15 text-red-600" },
  WITHDRAWN:    { label: "Withdrawn",    color: "bg-zinc-400/15 text-zinc-500" },
}

export const PRIORITY_CONFIG: Record<Priority, { label: string; dot: string }> = {
  HIGH:   { label: "High",   dot: "bg-red-500" },
  MEDIUM: { label: "Medium", dot: "bg-amber-400" },
  LOW:    { label: "Low",    dot: "bg-zinc-400" },
}

export const SOURCE_LABELS: Record<JobSource, string> = {
  LINKEDIN:     "LinkedIn",
  REFERRAL:     "Referral",
  COMPANY_SITE: "Company Site",
  RECRUITER:    "Recruiter",
  JOB_BOARD:    "Job Board",
  OTHER:        "Other",
}

export const LOCATION_LABELS: Record<LocationType, string> = {
  REMOTE: "Remote",
  HYBRID: "Hybrid",
  ONSITE: "On-site",
}

export function formatSalary(min: number | null, max: number | null, currency: string | null): string {
  if (!min && !max) return "—"
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 0 }).format(n)
  const curr = currency ?? "USD"
  const symbol = curr === "USD" ? "$" : curr === "EUR" ? "€" : curr === "GBP" ? "£" : curr
  if (min && max) return `${symbol}${fmt(min)} – ${symbol}${fmt(max)}`
  if (min) return `${symbol}${fmt(min)}+`
  return `up to ${symbol}${fmt(max!)}`
}
