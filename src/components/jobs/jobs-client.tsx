"use client"

import { useState, useMemo } from "react"
import { useSearchParams, usePathname, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Plus, Search } from "lucide-react"
import { Prisma, JobStatus, Priority, JobSource, LocationType } from "@prisma/client"
import { JobsTable } from "./jobs-table"
import { JobForm } from "./job-form"
import { JobsFilters, FilterState, EMPTY_FILTERS } from "./jobs-filters"
import type { SortCol, SortDir } from "./jobs-table"

type JobWithCompany = Prisma.JobGetPayload<{
  include: { company: { select: { name: true } } }
}>

const STATUS_ORDER: Record<JobStatus, number> = {
  BOOKMARKED: 0, APPLYING: 1, APPLIED: 2, PHONE_SCREEN: 3,
  INTERVIEW: 4, TECHNICAL: 5, OFFER: 6, ACCEPTED: 7,
  REJECTED: 8, WITHDRAWN: 9,
}
const PRIORITY_ORDER: Record<Priority, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 }

function parseList<T extends string>(val: string | null): T[] {
  if (!val) return []
  return val.split(",").filter(Boolean) as T[]
}

export function JobsClient({ jobs }: { jobs: JobWithCompany[] }) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()

  const [formOpen, setFormOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<JobWithCompany | null>(null)
  const [search, setSearch] = useState("")

  // ── Read URL params ──────────────────────────────────────────
  const sortCol  = (searchParams.get("sort") ?? "added") as SortCol
  const sortDir  = (searchParams.get("dir")  ?? "desc")  as SortDir

  const filters: FilterState = {
    statuses:       parseList<JobStatus>     (searchParams.get("status")),
    priorities:     parseList<Priority>      (searchParams.get("priority")),
    locationTypes:  parseList<LocationType>  (searchParams.get("loc")),
    sources:        parseList<JobSource>     (searchParams.get("source")),
    minExcitement:  searchParams.get("excitement") ? Number(searchParams.get("excitement")) : null,
    days:           searchParams.get("days")        ? Number(searchParams.get("days"))        : null,
  }

  // ── URL param writer ─────────────────────────────────────────
  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(updates)) {
      if (!v) params.delete(k)
      else params.set(k, v)
    }
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  function handleSort(col: SortCol) {
    if (col === sortCol) {
      updateParams({ dir: sortDir === "asc" ? "desc" : "asc" })
    } else {
      updateParams({ sort: col, dir: col === "added" ? "desc" : "asc" })
    }
  }

  function handleFiltersChange(f: FilterState) {
    updateParams({
      status:     f.statuses.join(",")      || null,
      priority:   f.priorities.join(",")    || null,
      loc:        f.locationTypes.join(",") || null,
      source:     f.sources.join(",")       || null,
      excitement: f.minExcitement?.toString() ?? null,
      days:       f.days?.toString()          ?? null,
    })
  }

  // ── Form helpers ─────────────────────────────────────────────
  function openAdd()  { setEditingJob(null); setFormOpen(true) }
  function openEdit(job: JobWithCompany) { setEditingJob(job); setFormOpen(true) }
  function closeForm() { setFormOpen(false); setEditingJob(null) }

  // ── Filter + sort (client-side) ──────────────────────────────
  const processed = useMemo(() => {
    let result = jobs

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (j) => j.title.toLowerCase().includes(q) || j.company.name.toLowerCase().includes(q)
      )
    }

    if (filters.statuses.length)      result = result.filter((j) => filters.statuses.includes(j.status))
    if (filters.priorities.length)    result = result.filter((j) => filters.priorities.includes(j.priority))
    if (filters.locationTypes.length) result = result.filter((j) => !!j.locationType && filters.locationTypes.includes(j.locationType))
    if (filters.sources.length)       result = result.filter((j) => !!j.source && filters.sources.includes(j.source))
    if (filters.minExcitement !== null) {
      result = result.filter((j) => j.excitement !== null && j.excitement >= filters.minExcitement!)
    }
    if (filters.days !== null) {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - filters.days)
      result = result.filter((j) => new Date(j.createdAt) >= cutoff)
    }

    const dir = sortDir === "asc" ? 1 : -1
    return [...result].sort((a, b) => {
      switch (sortCol) {
        case "title":   return dir * a.title.localeCompare(b.title)
        case "company": return dir * a.company.name.localeCompare(b.company.name)
        case "status":  return dir * (STATUS_ORDER[a.status] - STATUS_ORDER[b.status])
        case "priority":return dir * (PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
        case "excitement": return dir * ((a.excitement ?? 0) - (b.excitement ?? 0))
        case "salary":  return dir * ((a.salaryMin ?? 0) - (b.salaryMin ?? 0))
        case "nextStep": {
          if (!a.nextStepAt && !b.nextStepAt) return 0
          if (!a.nextStepAt) return 1
          if (!b.nextStepAt) return -1
          return dir * (new Date(a.nextStepAt).getTime() - new Date(b.nextStepAt).getTime())
        }
        case "added":
        default: return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      }
    })
  }, [jobs, search, filters.statuses, filters.priorities, filters.locationTypes, filters.sources, filters.minExcitement, filters.days, sortCol, sortDir])

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Applications</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {jobs.length} {jobs.length === 1 ? "application" : "applications"} tracked
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:flex-none">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search roles, companies…"
              className="pl-8 pr-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring w-full sm:w-56"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={openAdd}
            className="flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-3 sm:px-4 py-2 text-sm font-medium shadow-sm hover:opacity-90 transition-opacity shrink-0"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">Add application</span>
          </motion.button>
        </div>
      </div>

      {/* Filter bar */}
      <JobsFilters
        filters={filters}
        onChange={handleFiltersChange}
        totalCount={jobs.length}
        filteredCount={processed.length}
      />

      {/* Table */}
      <JobsTable
        jobs={processed}
        onEdit={openEdit}
        onAdd={openAdd}
        sortCol={sortCol}
        sortDir={sortDir}
        onSort={handleSort}
      />

      {/* Form drawer */}
      <JobForm open={formOpen} onClose={closeForm} job={editingJob} />
    </>
  )
}
