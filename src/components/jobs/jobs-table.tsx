"use client"

import { motion } from "framer-motion"
import { ArrowDown, ArrowUp, ArrowUpDown, Briefcase, Pencil, Trash2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Prisma } from "@prisma/client"
import { JobStatusBadge } from "./job-status-badge"
import { PRIORITY_CONFIG, SOURCE_LABELS, LOCATION_LABELS, formatSalary } from "@/lib/job-types"
import { deleteJob } from "@/app/actions/jobs"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { cn } from "@/lib/utils"

export type SortCol = "title" | "company" | "status" | "priority" | "excitement" | "salary" | "nextStep" | "added"
export type SortDir = "asc" | "desc"

type JobWithCompany = Prisma.JobGetPayload<{
  include: { company: { select: { name: true } } }
}>

type Props = {
  jobs: JobWithCompany[]
  onEdit: (job: JobWithCompany) => void
  onAdd: () => void
  sortCol: SortCol
  sortDir: SortDir
  onSort: (col: SortCol) => void
}

function NextStepCell({ date }: { date: Date | null }) {
  if (!date) return <span className="text-muted-foreground/40">—</span>
  const now = new Date()
  const isOverdue = date < now
  const isSoon = !isOverdue && date.getTime() - now.getTime() < 3 * 24 * 60 * 60 * 1000
  return (
    <span className={cn(
      "text-xs",
      isOverdue ? "text-red-500 font-medium" : isSoon ? "text-amber-500" : "text-muted-foreground"
    )}>
      {formatDistanceToNow(date, { addSuffix: true })}
    </span>
  )
}

function ExcitementStars({ value }: { value: number | null }) {
  if (!value) return <span className="text-muted-foreground/30 text-sm">—</span>
  return (
    <span className="text-sm leading-none">
      {"★".repeat(value)}<span className="text-muted-foreground/20">{"★".repeat(5 - value)}</span>
    </span>
  )
}

function SortableHeader({
  col,
  label,
  sortCol,
  sortDir,
  onSort,
  className,
}: {
  col: SortCol
  label: string
  sortCol: SortCol
  sortDir: SortDir
  onSort: (col: SortCol) => void
  className?: string
}) {
  const active = sortCol === col
  const Icon = active ? (sortDir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown

  return (
    <th
      onClick={() => onSort(col)}
      className={cn(
        "px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap cursor-pointer select-none group",
        className
      )}
    >
      <div className="flex items-center gap-1">
        <span className={cn("transition-colors", active ? "text-foreground" : "group-hover:text-foreground")}>
          {label}
        </span>
        <Icon
          size={11}
          className={cn(
            "transition-opacity shrink-0",
            active ? "opacity-70 text-foreground" : "opacity-0 group-hover:opacity-40"
          )}
        />
      </div>
    </th>
  )
}

export function JobsTable({ jobs, onEdit, onAdd, sortCol, sortDir, onSort }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  function handleDelete(id: string, title: string) {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return
    startTransition(async () => {
      await deleteJob(id)
      router.refresh()
    })
  }

  if (jobs.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center justify-center py-24 text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <Briefcase size={28} className="text-primary" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">No applications yet</h3>
        <p className="text-sm text-muted-foreground mb-6">Add your first job application to start tracking.</p>
        <button
          onClick={onAdd}
          className="bg-primary text-primary-foreground rounded-lg px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Add your first application
        </button>
      </motion.div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <SortableHeader col="title"      label="Company / Role" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
              <SortableHeader col="status"     label="Status"         sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
              <SortableHeader col="priority"   label="Priority"       sortCol={sortCol} sortDir={sortDir} onSort={onSort} className="hidden sm:table-cell" />
              <SortableHeader col="excitement" label="Excitement"     sortCol={sortCol} sortDir={sortDir} onSort={onSort} className="hidden md:table-cell" />
              <SortableHeader col="salary"     label="Salary"         sortCol={sortCol} sortDir={sortDir} onSort={onSort} className="hidden md:table-cell" />
              <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">Location</th>
              <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">Source</th>
              <SortableHeader col="nextStep"   label="Next step"      sortCol={sortCol} sortDir={sortDir} onSort={onSort} className="hidden lg:table-cell" />
              <SortableHeader col="added"      label="Added"          sortCol={sortCol} sortDir={sortDir} onSort={onSort} className="hidden lg:table-cell" />
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {jobs.map((job, i) => (
              <motion.tr
                key={job.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.22 }}
                onClick={() => onEdit(job)}
                className="hover:bg-accent/40 cursor-pointer transition-colors group"
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground leading-tight">{job.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{job.company.name}</p>
                </td>

                <td className="px-4 py-3">
                  <JobStatusBadge status={job.status} />
                </td>

                <td className="hidden sm:table-cell px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className={cn("w-2 h-2 rounded-full shrink-0", PRIORITY_CONFIG[job.priority].dot)} />
                    <span className="text-xs text-muted-foreground">{PRIORITY_CONFIG[job.priority].label}</span>
                  </div>
                </td>

                <td className="hidden md:table-cell px-4 py-3">
                  <ExcitementStars value={job.excitement} />
                </td>

                <td className="hidden md:table-cell px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                  {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}
                </td>

                <td className="hidden md:table-cell px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                  {job.locationType ? LOCATION_LABELS[job.locationType] : (job.location ?? "—")}
                </td>

                <td className="hidden lg:table-cell px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                  {job.source ? SOURCE_LABELS[job.source] : "—"}
                </td>

                <td className="hidden lg:table-cell px-4 py-3 whitespace-nowrap">
                  <NextStepCell date={job.nextStepAt} />
                </td>

                <td className="hidden lg:table-cell px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(job.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </td>

                <td className="px-4 py-3">
                  <div
                    className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => onEdit(job)}
                      className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(job.id, job.title)}
                      className="p-1.5 rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
