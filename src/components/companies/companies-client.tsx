"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Building2, Plus, Pencil, Trash2, ExternalLink,
  Briefcase, Users, ChevronDown, MapPin, Calendar, ArrowUpRight,
} from "lucide-react"
import { JobStatus, LocationType } from "@prisma/client"
import { deleteCompany } from "@/app/actions/companies"
import { getJob } from "@/app/actions/jobs"
import { CompanyForm } from "./company-form"
import { JobForm } from "@/components/jobs/job-form"
import { JobStatusBadge } from "@/components/jobs/job-status-badge"
import { LOCATION_LABELS } from "@/lib/job-types"

type Job = {
  id: string
  title: string
  status: JobStatus
  location: string | null
  locationType: LocationType | null
  appliedAt: Date | null
  createdAt: Date
}

type Company = {
  id: string
  name: string
  website: string | null
  industry: string | null
  size: string | null
  notes: string | null
  createdAt: Date
  jobs: Job[]
  _count: { jobs: number; contacts: number }
}

export function CompaniesClient({ companies }: { companies: Company[] }) {
  const [formOpen, setFormOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [search, setSearch] = useState("")
  const [openId, setOpenId] = useState<string | null>(null)

  const [jobFormOpen, setJobFormOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<Awaited<ReturnType<typeof getJob>> | null>(null)

  const filtered = companies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.industry ?? "").toLowerCase().includes(search.toLowerCase())
  )

  function handleAdd() {
    setEditingCompany(null)
    setFormOpen(true)
  }

  function handleEdit(c: Company) {
    setEditingCompany(c)
    setFormOpen(true)
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    if (openId === id) setOpenId(null)
    await deleteCompany(id)
  }

  async function handleJobClick(jobId: string) {
    const job = await getJob(jobId)
    if (job) {
      setEditingJob(job)
      setJobFormOpen(true)
    }
  }

  function toggleOpen(id: string) {
    setOpenId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="p-4 sm:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-start justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Companies</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Companies you've applied to or are tracking
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity shrink-0"
        >
          <Plus size={15} />
          Add company
        </button>
      </motion.div>

      {/* Search */}
      {companies.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="mt-5"
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or industry…"
            className="w-full max-w-xs rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60 transition-colors"
          />
        </motion.div>
      )}

      {/* Empty state */}
      {companies.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 flex flex-col items-center justify-center py-24 text-center"
        >
          <div className="w-16 h-16 bg-primary/10 flex items-center justify-center mb-4">
            <Building2 size={28} className="text-primary" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1">No companies yet</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Add companies you're targeting or have applied to.
          </p>
          <button
            onClick={handleAdd}
            className="bg-primary text-primary-foreground rounded-lg px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Add your first company
          </button>
        </motion.div>
      )}

      {/* No results */}
      {companies.length > 0 && filtered.length === 0 && (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          No companies match "{search}"
        </p>
      )}

      {/* Card grid */}
      {filtered.length > 0 && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((company, i) => {
            const isOpen = openId === company.id
            return (
              <motion.div
                key={company.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                className="group border border-border bg-card flex flex-col overflow-hidden hover:border-primary/40 transition-colors"
              >
                {/* Card body */}
                <div className="p-5 flex flex-col gap-3">
                  {/* Action buttons */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-semibold text-sm text-foreground leading-tight">
                          {company.name}
                        </h3>
                        {company.website && /^https?:\/\//i.test(company.website) && (
                          <a
                            href={company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                          >
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                      {company.industry && (
                        <p className="text-xs text-muted-foreground mt-0.5">{company.industry}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => handleEdit(company)}
                        className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => handleDelete(company.id, company.name)}
                        className="p-1.5 rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {company.size && (
                      <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium bg-accent text-muted-foreground border border-border">
                        {company.size} employees
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-accent text-muted-foreground border border-border">
                      <Briefcase size={10} />
                      {company._count.jobs} {company._count.jobs === 1 ? "role" : "roles"}
                    </span>
                    {company._count.contacts > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-accent text-muted-foreground border border-border">
                        <Users size={10} />
                        {company._count.contacts} {company._count.contacts === 1 ? "contact" : "contacts"}
                      </span>
                    )}
                  </div>

                  {/* Notes preview */}
                  {company.notes && !isOpen && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {company.notes}
                    </p>
                  )}
                </div>

                {/* Accordion toggle — only if there are jobs */}
                {company.jobs.length > 0 && (
                  <button
                    onClick={() => toggleOpen(company.id)}
                    className="flex items-center justify-between gap-2 px-5 py-2.5 border-t border-border/60 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors"
                  >
                    <span>{isOpen ? "Hide roles" : `Show ${company.jobs.length} ${company.jobs.length === 1 ? "role" : "roles"}`}</span>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown size={14} />
                    </motion.div>
                  </button>
                )}

                {/* Accordion body */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="jobs"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 py-3 border-t border-border/60 flex flex-col gap-1">
                        {company.notes && (
                          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                            {company.notes}
                          </p>
                        )}
                        {company.jobs.map((job, ji) => (
                          <motion.button
                            key={job.id}
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.18, delay: ji * 0.04 }}
                            onClick={() => handleJobClick(job.id)}
                            className="w-full text-left flex items-center gap-3 py-2 px-2 -mx-2 rounded hover:bg-accent/60 transition-colors group/job"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-foreground truncate flex items-center gap-1">
                                {job.title}
                                <ArrowUpRight size={10} className="shrink-0 opacity-0 group-hover/job:opacity-60 transition-opacity" />
                              </p>
                              {(job.location || job.locationType) && (
                                <p className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                                  <MapPin size={9} />
                                  {job.locationType ? LOCATION_LABELS[job.locationType] : job.location}
                                  {job.locationType && job.location && ` · ${job.location}`}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <JobStatusBadge status={job.status} />
                              {(job.appliedAt ?? job.createdAt) && (
                                <span className="hidden sm:flex items-center gap-1 text-[11px] text-muted-foreground">
                                  <Calendar size={9} />
                                  {new Date(job.appliedAt ?? job.createdAt).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </span>
                              )}
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}

      <CompanyForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        company={editingCompany}
      />

      <JobForm
        open={jobFormOpen}
        onClose={() => { setJobFormOpen(false); setEditingJob(null) }}
        job={editingJob}
      />
    </div>
  )
}
