"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { useRouter } from "next/navigation"
import { JobStatus, Priority, JobSource, LocationType } from "@prisma/client"
import { Prisma } from "@prisma/client"
import { createJob, updateJob, searchCompanies } from "@/app/actions/jobs"
import { PRIORITY_CONFIG, SOURCE_LABELS, LOCATION_LABELS } from "@/lib/job-types"
import { cn } from "@/lib/utils"

type JobWithCompany = Prisma.JobGetPayload<{
  include: { company: { select: { name: true } } }
}>

type Props = {
  open: boolean
  onClose: () => void
  job?: JobWithCompany | null
}

const inputClass =
  "border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/40 w-full"

const selectClass =
  "border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring w-full"

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest pt-2 pb-1">
      {children}
    </p>
  )
}

function StarPicker({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(value === n ? null : n)}
          className={cn(
            "text-xl leading-none transition-colors",
            n <= (value ?? 0) ? "text-amber-400" : "text-muted-foreground/20 hover:text-amber-300"
          )}
        >
          ★
        </button>
      ))}
    </div>
  )
}

function PriorityPicker({ value, onChange }: { value: Priority; onChange: (v: Priority) => void }) {
  return (
    <div className="flex rounded-lg border border-border overflow-hidden text-xs">
      {(["HIGH", "MEDIUM", "LOW"] as Priority[]).map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          className={cn(
            "flex-1 py-2 font-medium flex items-center justify-center gap-1.5 transition-colors",
            value === p
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", PRIORITY_CONFIG[p].dot)} />
          {PRIORITY_CONFIG[p].label}
        </button>
      ))}
    </div>
  )
}

function CompanyAutocomplete({ defaultValue }: { defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue ?? "")
  const [suggestions, setSuggestions] = useState<{ id: string; name: string }[]>([])
  const [open, setOpen] = useState(false)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleChange(q: string) {
    setValue(q)
    if (debounce.current) clearTimeout(debounce.current)
    if (!q.trim()) { setSuggestions([]); setOpen(false); return }
    debounce.current = setTimeout(async () => {
      const results = await searchCompanies(q)
      setSuggestions(results)
      setOpen(results.length > 0)
    }, 300)
  }

  return (
    <div className="relative">
      <input
        name="companyName"
        required
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="e.g. Stripe"
        className={inputClass}
      />
      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute z-50 mt-1 w-full bg-card border border-border rounded-lg shadow-lg overflow-hidden"
          >
            {suggestions.map((s) => (
              <li
                key={s.id}
                onMouseDown={() => { setValue(s.name); setOpen(false) }}
                className="px-3 py-2 text-sm cursor-pointer hover:bg-accent text-foreground"
              >
                {s.name}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

function toDateInput(d: Date | null | undefined) {
  if (!d) return ""
  return new Date(d).toISOString().split("T")[0]
}

export function JobForm({ open, onClose, job }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [priority, setPriority] = useState<Priority>(job?.priority ?? "MEDIUM")
  const [excitement, setExcitement] = useState<number | null>(job?.excitement ?? null)
  const isEdit = !!job

  useEffect(() => {
    if (open) {
      setPriority(job?.priority ?? "MEDIUM")
      setExcitement(job?.excitement ?? null)
      setError(null)
    }
  }, [open, job])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set("priority", priority)
    if (excitement !== null) formData.set("excitement", String(excitement))

    startTransition(async () => {
      const result = isEdit
        ? await updateJob(job.id, formData)
        : await createJob(formData)

      if (!result.success) {
        setError(result.error ?? "Something went wrong")
        return
      }
      router.refresh()
      onClose()
    })
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed right-0 top-0 h-full w-full max-w-[480px] bg-card border-l border-border z-50 flex flex-col shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <h2 className="text-base font-semibold text-foreground">
                {isEdit ? "Edit application" : "Add application"}
              </h2>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form id="job-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3">

              <SectionLabel>Role</SectionLabel>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted-foreground">Job title *</label>
                <input name="title" required defaultValue={job?.title} placeholder="e.g. Senior Frontend Engineer" className={inputClass} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted-foreground">Company *</label>
                <CompanyAutocomplete defaultValue={job?.company.name} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted-foreground">Status</label>
                <select name="status" defaultValue={job?.status ?? "BOOKMARKED"} className={selectClass}>
                  {(["BOOKMARKED","APPLYING","APPLIED","PHONE_SCREEN","INTERVIEW","TECHNICAL","OFFER","ACCEPTED","REJECTED","WITHDRAWN"] as JobStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, " ").replace(/\b\w/g, c => c)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted-foreground">Priority</label>
                <PriorityPicker value={priority} onChange={setPriority} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted-foreground">Excitement</label>
                <StarPicker value={excitement} onChange={setExcitement} />
              </div>

              <SectionLabel>Location & Salary</SectionLabel>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted-foreground">Location</label>
                  <input name="location" defaultValue={job?.location ?? ""} placeholder="e.g. New York, NY" className={inputClass} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted-foreground">Type</label>
                  <select name="locationType" defaultValue={job?.locationType ?? ""} className={selectClass}>
                    <option value="">—</option>
                    {(["REMOTE","HYBRID","ONSITE"] as LocationType[]).map((t) => (
                      <option key={t} value={t}>{LOCATION_LABELS[t]}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 items-end">
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-xs text-muted-foreground">Min salary</label>
                  <input name="salaryMin" type="number" defaultValue={job?.salaryMin ?? ""} placeholder="80000" className={inputClass} />
                </div>
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-xs text-muted-foreground">Max salary</label>
                  <input name="salaryMax" type="number" defaultValue={job?.salaryMax ?? ""} placeholder="120000" className={inputClass} />
                </div>
                <div className="flex flex-col gap-1.5 w-24">
                  <label className="text-xs text-muted-foreground">Currency</label>
                  <select name="salaryCurrency" defaultValue={job?.salaryCurrency ?? "USD"} className={selectClass}>
                    <option>USD</option>
                    <option>EUR</option>
                    <option>GBP</option>
                  </select>
                </div>
              </div>

              <SectionLabel>Source & Contact</SectionLabel>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted-foreground">Source</label>
                  <select name="source" defaultValue={job?.source ?? ""} className={selectClass}>
                    <option value="">—</option>
                    {(Object.keys(SOURCE_LABELS) as JobSource[]).map((s) => (
                      <option key={s} value={s}>{SOURCE_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted-foreground">Recruiter name</label>
                  <input name="recruiterName" defaultValue={job?.recruiterName ?? ""} placeholder="Jane Smith" className={inputClass} />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted-foreground">Job URL</label>
                <input name="jobUrl" type="url" defaultValue={job?.jobUrl ?? ""} placeholder="https://..." className={inputClass} />
              </div>

              <SectionLabel>Dates</SectionLabel>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted-foreground">Applied on</label>
                  <input name="appliedAt" type="date" defaultValue={toDateInput(job?.appliedAt)} className={inputClass} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted-foreground">Deadline</label>
                  <input name="deadlineAt" type="date" defaultValue={toDateInput(job?.deadlineAt)} className={inputClass} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted-foreground">Next step</label>
                  <input name="nextStepAt" type="date" defaultValue={toDateInput(job?.nextStepAt)} className={inputClass} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted-foreground">Offer deadline</label>
                  <input name="offerDeadline" type="date" defaultValue={toDateInput(job?.offerDeadline)} className={inputClass} />
                </div>
              </div>

              {(job?.status === "OFFER" || job?.status === "ACCEPTED") && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted-foreground">Offer amount</label>
                  <input name="offerAmount" type="number" defaultValue={job?.offerAmount ?? ""} placeholder="125000" className={inputClass} />
                </div>
              )}

              <SectionLabel>Notes</SectionLabel>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted-foreground">Notes</label>
                <textarea name="notes" rows={3} defaultValue={job?.notes ?? ""} placeholder="Anything worth remembering…" className={cn(inputClass, "resize-none")} />
              </div>

              <div className="flex flex-col gap-1.5 pb-2">
                <label className="text-xs text-muted-foreground">Job description <span className="text-muted-foreground/50">(for AI analysis)</span></label>
                <textarea name="jobDescription" rows={5} defaultValue={job?.jobDescription ?? ""} placeholder="Paste the full job description here…" className={cn(inputClass, "resize-none")} />
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </form>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3 shrink-0">
              <button type="button" onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-2">
                Cancel
              </button>
              <button
                type="submit"
                form="job-form"
                disabled={isPending}
                className="bg-primary text-primary-foreground rounded-lg px-5 py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isPending ? "Saving…" : isEdit ? "Save changes" : "Add application"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
